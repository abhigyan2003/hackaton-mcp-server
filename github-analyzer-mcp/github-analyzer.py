from typing import Any, Dict, List, Optional
import httpx
import base64
import json
import re
from datetime import datetime, timedelta
from mcp.server.fastmcp import FastMCP
import os

# Initialize FastMCP server
mcp = FastMCP("github-analyzer")

# Constants
GITHUB_API_BASE = "https://api.github.com"
USER_AGENT = "github-analyzer-mcp/1.0"

class GitHubAnalyzer:
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": USER_AGENT,
            "X-GitHub-Api-Version": "2022-11-28"
        }

    async def make_request(self, url: str, params: Optional[Dict] = None) -> Dict[str, Any] | None:
        """Make authenticated request to GitHub API."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, params=params, timeout=30.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"API request failed: {e}")
                return None

    async def get_file_content(self, owner: str, repo: str, path: str) -> str | None:
        """Get file content from repository."""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}"
        data = await self.make_request(url)
        
        if not data or "content" not in data:
            return None
            
        try:
            content = base64.b64decode(data["content"]).decode('utf-8')
            return content
        except:
            return None

    async def analyze_repository_structure(self, owner: str, repo: str) -> Dict[str, Any]:
        """Analyze repository structure and provide insights."""
        
        # Get repository info
        repo_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}"
        repo_data = await self.make_request(repo_url)
        
        if not repo_data:
            return {"error": "Repository not found or access denied"}

        # Get repository contents
        contents_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents"
        contents_data = await self.make_request(contents_url)
        
        if not contents_data:
            contents_data = []

        # Get languages
        languages_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/languages"
        languages_data = await self.make_request(languages_url) or {}

        # Get recent commits
        commits_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits"
        commits_data = await self.make_request(commits_url, {"per_page": 10}) or []

        # Get issues and PRs
        issues_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues"
        issues_data = await self.make_request(issues_url, {"state": "open", "per_page": 10}) or []

        return {
            "repository": repo_data,
            "contents": contents_data,
            "languages": languages_data,
            "recent_commits": commits_data,
            "open_issues": issues_data
        }

    def analyze_beginner_friendliness(self, repo_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze how beginner-friendly a repository is."""
        
        repo_info = repo_data.get("repository", {})
        contents = repo_data.get("contents", [])
        languages = repo_data.get("languages", {})
        
        # Check for beginner-friendly indicators
        has_readme = any(item.get("name", "").lower() == "readme.md" for item in contents)
        has_contributing = any("contributing" in item.get("name", "").lower() for item in contents)
        has_license = any("license" in item.get("name", "").lower() for item in contents)
        has_good_description = bool(repo_info.get("description", "").strip())
        has_topics = len(repo_info.get("topics", [])) > 0
        
        # Count documentation files
        doc_files = [item for item in contents if item.get("name", "").lower().endswith(('.md', '.txt', '.rst'))]
        
        # Calculate beginner-friendliness score
        score = 0
        factors = []
        
        if has_readme:
            score += 25
            factors.append("✅ Has README.md")
        else:
            factors.append("❌ Missing README.md - essential for explaining the project")
            
        if has_contributing:
            score += 15
            factors.append("✅ Has contributing guidelines")
        else:
            factors.append("⚠️ Missing contributing guidelines")
            
        if has_license:
            score += 10
            factors.append("✅ Has license file")
        else:
            factors.append("⚠️ Missing license file")
            
        if has_good_description:
            score += 15
            factors.append("✅ Has clear description")
        else:
            factors.append("❌ Missing or poor description")
            
        if has_topics:
            score += 10
            factors.append(f"✅ Has {len(repo_info.get('topics', []))} topic tags")
        else:
            factors.append("⚠️ No topic tags for discoverability")
            
        if len(doc_files) > 2:
            score += 15
            factors.append(f"✅ Good documentation ({len(doc_files)} doc files)")
        else:
            factors.append("⚠️ Limited documentation")
            
        # Check complexity based on languages
        total_bytes = sum(languages.values())
        main_language = max(languages.items(), key=lambda x: x[1])[0] if languages else "Unknown"
        
        if main_language.lower() in ['python', 'javascript', 'typescript']:
            score += 10
            factors.append(f"✅ Uses beginner-friendly language ({main_language})")
        elif main_language.lower() in ['c', 'c++', 'rust', 'assembly']:
            score -= 5
            factors.append(f"⚠️ Uses complex language ({main_language})")
        else:
            factors.append(f"◯ Language: {main_language}")
            
        # Repository age and activity
        created_at = datetime.fromisoformat(repo_info.get("created_at", "").replace('Z', '+00:00'))
        age_days = (datetime.now().astimezone() - created_at).days
        
        if age_days > 30:  # Mature project
            score += 5
            factors.append("✅ Mature project (30+ days old)")
        else:
            factors.append("⚠️ Very new project")
            
        # Determine level
        if score >= 80:
            level = "🟢 Very Beginner Friendly"
        elif score >= 60:
            level = "🟡 Moderately Beginner Friendly"
        elif score >= 40:
            level = "🟠 Somewhat Beginner Friendly"
        else:
            level = "🔴 Not Beginner Friendly"
            
        return {
            "score": score,
            "level": level,
            "factors": factors,
            "main_language": main_language,
            "total_languages": len(languages),
            "documentation_files": len(doc_files)
        }

# Create global analyzer instance (will be set when token is provided)
analyzer = None

@mcp.tool()
async def analyze_repository(owner: str, repo: str) -> str:
    """Analyze a GitHub repository for structure, complexity, and beginner-friendliness.
    
    Args:
        owner: Repository owner (username or organization)
        repo: Repository name
        github_token: GitHub personal access token for API access
    """
    global analyzer
    token = os.getenv("GITHUB_ACCESS_TOKEN")
    if token:
        analyzer = GitHubAnalyzer(token)
    else:
        print("Could not read token")
    
    try:
        # Get comprehensive repository data
        repo_data = await analyzer.analyze_repository_structure(owner, repo)
        
        if "error" in repo_data:
            return f"Error: {repo_data['error']}"
        
        # Analyze beginner-friendliness
        beginner_analysis = analyzer.analyze_beginner_friendliness(repo_data)
        
        # Format results
        repo_info = repo_data["repository"]
        languages = repo_data["languages"]
        
        result = f"""
# Repository Analysis: {owner}/{repo}

## Basic Information
- **Description**: {repo_info.get('description', 'No description provided')}
- **Stars**: {repo_info.get('stargazers_count', 0):,}
- **Forks**: {repo_info.get('forks_count', 0):,}
- **Open Issues**: {repo_info.get('open_issues_count', 0)}
- **Created**: {repo_info.get('created_at', 'Unknown')}
- **Last Updated**: {repo_info.get('updated_at', 'Unknown')}
- **Default Branch**: {repo_info.get('default_branch', 'main')}

## Programming Languages
"""
        
        if languages:
            total_bytes = sum(languages.values())
            for lang, bytes_count in sorted(languages.items(), key=lambda x: x[1], reverse=True):
                percentage = (bytes_count / total_bytes) * 100
                result += f"- **{lang}**: {percentage:.1f}%\n"
        else:
            result += "- No language data available\n"
            
        result += f"""
## Beginner-Friendliness Assessment

**Overall Rating**: {beginner_analysis['level']} ({beginner_analysis['score']}/100)

### Analysis Factors:
"""
        
        for factor in beginner_analysis['factors']:
            result += f"- {factor}\n"
            
        # Recent activity
        recent_commits = repo_data.get("recent_commits", [])
        if recent_commits:
            result += f"\n## Recent Activity\n"
            result += f"- **Recent Commits**: {len(recent_commits)} in history\n"
            
            latest_commit = recent_commits[0]
            commit_date = latest_commit.get('commit', {}).get('committer', {}).get('date', 'Unknown')
            result += f"- **Last Commit**: {commit_date}\n"
            result += f"- **Last Commit Message**: {latest_commit.get('commit', {}).get('message', 'No message')[:100]}...\n"
        
        # Issues and collaboration
        open_issues = repo_data.get("open_issues", [])
        if open_issues:
            result += f"\n## Open Issues & Collaboration\n"
            result += f"- **Open Issues**: {len(open_issues)} shown (may be more)\n"
            
            recent_issues = open_issues[:3]
            for issue in recent_issues:
                result += f"  - [{issue.get('number')}] {issue.get('title', 'No title')[:50]}...\n"
        
        return result
        
    except Exception as e:
        return f"Error analyzing repository: {str(e)}"

@mcp.tool()
async def get_beginner_resources(owner: str, repo: str) -> str:
    """Extract beginner-friendly resources and documentation from a repository.
    
    Args:
        owner: Repository owner (username or organization)
        repo: Repository name  
        github_token: GitHub personal access token for API access
    """
    global analyzer
    token = os.getenv("GITHUB_ACCESS_TOKEN")
    if token:
        analyzer = GitHubAnalyzer(token)
    else:
        print("Could not read token")
    
    try:
        # Get repository contents
        contents_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents"
        contents_data = await analyzer.make_request(contents_url) or []
        
        # Find documentation files
        doc_files = []
        for item in contents_data:
            name = item.get("name", "").lower()
            if any(keyword in name for keyword in ["readme", "getting", "started", "tutorial", "guide", "contributing", "install", "setup"]):
                doc_files.append(item)
        
        result = f"# Beginner Resources for {owner}/{repo}\n\n"
        
        if not doc_files:
            result += "❌ No obvious beginner documentation found.\n"
            return result
            
        # Get content of key files
        for doc_file in doc_files[:5]:  # Limit to first 5 files
            file_name = doc_file.get("name", "")
            result += f"## 📄 {file_name}\n"
            
            # Get file content
            content = await analyzer.get_file_content(owner, repo, file_name)
            if content:
                # Extract first few lines or sections
                lines = content.split('\n')
                preview_lines = lines[:10] if len(lines) > 10 else lines
                result += f"```\n"
                result += '\n'.join(preview_lines)
                if len(lines) > 10:
                    result += f"\n... (truncated, {len(lines)} total lines)"
                result += f"\n```\n\n"
            else:
                result += "Could not retrieve file content.\n\n"
        
        return result
        
    except Exception as e:
        return f"Error getting beginner resources: {str(e)}"

@mcp.tool()
async def suggest_good_first_issues(owner: str, repo: str) -> str:
    """Find and suggest good first issues for beginners in a repository.
    
    Args:
        owner: Repository owner (username or organization)
        repo: Repository name
        github_token: GitHub personal access token for API access
    """
    global analyzer  
    token = os.getenv("GITHUB_ACCESS_TOKEN")
    if token:
        analyzer = GitHubAnalyzer(token)
    else:
        print("Could not read token")
    
    
    try:
        # Search for issues with beginner-friendly labels
        beginner_labels = [
            "good first issue", "beginner", "easy", "starter", "first-timers-only",
            "help wanted", "documentation", "hacktoberfest"
        ]
        
        good_issues = []
        
        for label in beginner_labels:
            issues_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues"
            params = {
                "labels": label,
                "state": "open",
                "per_page": 10
            }
            
            issues = await analyzer.make_request(issues_url, params) or []
            
            for issue in issues:
                if issue not in good_issues:  # Avoid duplicates
                    good_issues.append(issue)
        
        result = f"# Good First Issues for {owner}/{repo}\n\n"
        
        if not good_issues:
            result += "❌ No issues specifically labeled for beginners found.\n"
            result += "💡 Consider looking at the general issues list or contributing documentation.\n"
            return result
            
        result += f"Found {len(good_issues)} beginner-friendly issues:\n\n"
        
        # Sort by creation date (newest first) and show top 5
        good_issues.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        for i, issue in enumerate(good_issues[:5], 1):
            title = issue.get('title', 'No title')
            number = issue.get('number', 'N/A')
            labels = [label.get('name', '') for label in issue.get('labels', [])]
            created = issue.get('created_at', 'Unknown')
            comments = issue.get('comments', 0)
            
            result += f"## {i}. [{number}] {title}\n"
            result += f"**Labels**: {', '.join(labels)}\n"
            result += f"**Created**: {created}\n" 
            result += f"**Comments**: {comments}\n"
            result += f"**URL**: {issue.get('html_url', 'N/A')}\n"
            
            # Show issue body preview
            body = issue.get('body', '')
            if body:
                preview = body[:200] + "..." if len(body) > 200 else body
                result += f"**Description**: {preview}\n"
            
            result += "\n---\n\n"
        
        if len(good_issues) > 5:
            result += f"... and {len(good_issues) - 5} more issues available.\n"
            
        return result
        
    except Exception as e:
        return f"Error finding good first issues: {str(e)}"

@mcp.tool()
async def compare_repositories(repos: str) -> str:
    """Compare multiple repositories for beginner-friendliness and features.
    
    Args:
        repos: Comma-separated list of repositories in format "owner/repo" (e.g., "microsoft/vscode,facebook/react")
        github_token: GitHub personal access token for API access
    """
    global analyzer
    token = os.getenv("GITHUB_ACCESS_TOKEN")
    if token:
        analyzer = GitHubAnalyzer(token)
    else:
        print("Could not read token")
    
    try:
        repo_list = [r.strip() for r in repos.split(",")]
        
        if len(repo_list) > 5:
            return "Error: Maximum 5 repositories can be compared at once."
        
        results = []
        
        for repo_full_name in repo_list:
            if "/" not in repo_full_name:
                results.append({
                    "repo": repo_full_name,
                    "error": "Invalid format. Use 'owner/repo'"
                })
                continue
                
            owner, repo = repo_full_name.split("/", 1)
            
            # Get analysis for this repo
            repo_data = await analyzer.analyze_repository_structure(owner, repo)
            
            if "error" in repo_data:
                results.append({
                    "repo": repo_full_name,
                    "error": repo_data["error"]
                })
                continue
            
            beginner_analysis = analyzer.analyze_beginner_friendliness(repo_data)
            repo_info = repo_data["repository"]
            
            results.append({
                "repo": repo_full_name,
                "score": beginner_analysis["score"],
                "level": beginner_analysis["level"],
                "stars": repo_info.get("stargazers_count", 0),
                "forks": repo_info.get("forks_count", 0),
                "issues": repo_info.get("open_issues_count", 0),
                "language": beginner_analysis["main_language"],
                "description": repo_info.get("description", "No description")[:100] + "...",
                "factors": beginner_analysis["factors"][:3]  # Top 3 factors
            })
        
        # Create comparison table
        result = "# Repository Comparison\n\n"
        
        # Sort by beginner-friendliness score
        valid_results = [r for r in results if "error" not in r]
        error_results = [r for r in results if "error" in r]
        
        if valid_results:
            valid_results.sort(key=lambda x: x["score"], reverse=True)
            
            result += "## Rankings (by Beginner-Friendliness)\n\n"
            
            for i, repo_data in enumerate(valid_results, 1):
                result += f"### {i}. {repo_data['repo']} ({repo_data['score']}/100)\n"
                result += f"**Level**: {repo_data['level']}\n"
                result += f"**Language**: {repo_data['language']}\n"
                result += f"**Stats**: ⭐{repo_data['stars']:,} | 🍴{repo_data['forks']:,} | 🐛{repo_data['issues']:,}\n"
                result += f"**Description**: {repo_data['description']}\n"
                result += "**Key Factors**:\n"
                for factor in repo_data['factors']:
                    result += f"  - {factor}\n"
                result += "\n"
            
            # Summary table
            result += "## Quick Comparison\n\n"
            result += "| Repository | Score | Level | Stars | Language |\n"
            result += "|------------|-------|-------|-------|----------|\n"
            
            for repo_data in valid_results:
                stars_k = f"{repo_data['stars']/1000:.1f}k" if repo_data['stars'] > 1000 else str(repo_data['stars'])
                level_emoji = repo_data['level'][:2]  # Just the emoji
                result += f"| {repo_data['repo']} | {repo_data['score']}/100 | {level_emoji} | {stars_k} | {repo_data['language']} |\n"
        
        # Show errors if any
        if error_results:
            result += "\n## Errors\n\n"
            for repo_data in error_results:
                result += f"- **{repo_data['repo']}**: {repo_data['error']}\n"
        
        return result
        
    except Exception as e:
        return f"Error comparing repositories: {str(e)}"

if __name__ == "__main__":
    import os
    transport = os.getenv("MCP_TRANSPORT", "stdio")
    mcp.run(transport=transport)