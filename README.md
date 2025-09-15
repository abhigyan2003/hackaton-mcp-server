# 🔍 Repository Discovery Platform

**MCP Hackathon 2025 - Theme 1: Civic Engagement**

## Repo Scout

A smart repository discovery platform that helps developers find the perfect GitHub repositories for their projects and learning journey.

## 🎯 Problem Statement

In today's vast open-source ecosystem, developers struggle to:
- Find relevant repositories for new projects
- Discover beginner-friendly repositories to contribute to
- Get meaningful brainstorming ideas from existing codebases
- Identify repositories that match their skill level and interests

## 💡 Solution Overview

Our platform leverages Model Control Protocol (MCP) servers and AI to provide intelligent repository recommendations through a user-friendly web interface.

### Key Features
- **Smart Repository Search**: AI-powered search using GitHub MCP tools
- **Beginner-Friendly Filtering**: Identifies good first issues and beginner resources
- **Repository Analysis**: Deep analysis of repository quality, activity, and community
- **Comparative Analysis**: Compare multiple repositories to make informed decisions
- **Personalized Recommendations**: Tailored suggestions based on user preferences

## 🏗️ Architecture

### Two Implementation Approaches

#### Approach 1: LM Studio Integration
- **Primary Stack**: Next.js frontend + Flask backend
- **AI Model**: LM Studio with customizable parameters
- **MCP Integration**: Docker-hosted GitHub MCP servers
- **Communication**: CLI streams with stdin/stdout
- **Orchestration**: LangGraph for workflow management

#### Approach 2: Claude Desktop (Optimized)
- **Platform**: Claude Desktop application
- **Performance**: Enhanced speed and efficiency
- **MCP Tools**: Direct integration with GitHub and custom repo_analyzer MCPs

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js
- **Authentication**: Descope (OAuth with GitHub & Google)
- **Styling**: Modern responsive design

### Backend
- **API Server**: Flask
- **AI Integration**: LM Studio API / Claude Desktop
- **Workflow**: LangGraph for repository filtering and analysis
- **Containerization**: Docker for MCP servers

### MCP Tools
1. **GitHub MCP** (Standard)
   - `search_repository`
   - `get_issues`
   - `get_directory_contents`

2. **Custom repo_analyzer MCP** (FastMCP)
   - `analyze_repository`
   - `get_beginner_resources`
   - `suggest_good_first_issues`
   - `compare_repositories`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Docker
- LM Studio (for Approach 1)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd repository-discovery-platform
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   pip install flask httpx fastmcp flask-cors
   python app.py
   ```

4. **MCP Server Setup**
   ```bash
   docker-compose up -d
   ```

### Configuration

1. **Environment Variables**
   ```env
   GITHUB_PERSONAL_ACCESS_TOKEN = <your_github_token>
   DESCOPE_PROJECT_ID = your_descope_project_id
   DESCOPE_MANAGEMENT_KEY = descope_management_key
   LM_STUDIO_API_URL = http://localhost:1234
   ```

2. **LM Studio Configuration**
   - Start LM Studio server on port 1234
   - Load your preferred model
   - Configure MCP integration

## 📱 Usage

### Web Interface

1. **Sign In**: `http://localhost:3000/sign-in`
   - GitHub or Google OAuth via Descope

2. **Generate Recommendations**: `http://localhost:3000/generate`
   - Enter your project description or interests
   - Customize AI parameters (temperature, max tokens, top-k, etc.)
   - Get intelligent repository recommendations

### API Endpoints

#### LM Studio Endpoints
- `GET /health` - Server health check
- `GET /models` - Available models
- `POST /chat` - Process prompts
- `POST /chat/completions` - Get AI completions

## 🔧 Features Deep Dive

### Intelligent Filtering
- **Star Count Analysis**: Repository popularity metrics
- **Commit History**: Activity and maintenance status
- **Issue Management**: Active community engagement
- **Contributor Analysis**: Community size and diversity

### Repository Quality Assessment
- **README Quality**: Documentation completeness
- **License Compliance**: Open-source license verification
- **Beginner Friendliness**: Good first issues and contribution guides
- **Project Structure**: Code organization and best practices

### Personalization
- **Skill Level Matching**: Beginner to advanced recommendations
- **Technology Stack**: Language and framework preferences
- **Contribution History**: Based on user's GitHub activity

## 🎮 Demo
![image](../descope-nextjs-auth-rbac/public/snap_1.PNG)
![image](../descope-nextjs-auth-rbac/public/snap_2.PNG)
![image](../descope-nextjs-auth-rbac/public/snap_3.PNG)
![image](../descope-nextjs-auth-rbac/public/snap_4.PNG)
![image](../descope-nextjs-auth-rbac/public/snap_6.PNG)

## Architecture
![image](../descope-nextjs-auth-rbac/public/diagram(working).PNG)

## 🏆 Hackathon Results

### Achievements
- Successfully integrated multiple MCP servers
- Created custom MCP tools for enhanced repository analysis
- Implemented two different architectural approaches
- Achieved significant performance improvements in Approach 2

### Lessons Learned
- MCP integration challenges with stdin/stdout communication
- Performance optimization through Claude Desktop integration
- Importance of user experience in AI-powered applications

## 👥 Team

- [Proytookh Dutta] - Frontend Development
- [Ammar Arsiwala] - Backend & MCP Integration (https://github.com/ammar-arsiwala)
- [Siyaram Sharma] - AI Model Integration (https://github.com/Siyaram68)
- [Abhigyan Borah] - DevOps 
- [Aaddii Guleria] - Documentation 

## 🙏 Acknowledgments

- MCP Hackathon organizers
- GitHub API for repository data
- LM Studio team for local AI model hosting
- Descope for authentication solutions
- FastMCP for simplified MCP development


**Built with ❤️ for the MCP Hackathon 2025**
