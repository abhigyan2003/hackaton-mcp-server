from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import logging
from typing import Dict, Any, Optional
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default LM Studio configuration
DEFAULT_LM_STUDIO_URL = "http://localhost:1234/v1"
LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", DEFAULT_LM_STUDIO_URL)

class LLMParameterValidator:
    """Validates and sanitizes LLM parameters"""
    
    @staticmethod
    def validate_parameters(params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and return sanitized parameters"""
        validated = {}
        
        # Temperature: Controls randomness (0.0-2.0)
        if 'temperature' in params:
            validated['temperature'] = max(0.0, min(2.0, float(params['temperature'])))
        else:
            validated['temperature'] = 0.7
            
        # Top-p: Nucleus sampling (0.0-1.0)
        if 'top_p' in params:
            validated['top_p'] = max(0.0, min(1.0, float(params['top_p'])))
        else:
            validated['top_p'] = 0.9
            
        # Top-k: Top-k sampling (1-100)
        if 'top_k' in params:
            validated['top_k'] = max(1, min(100, int(params['top_k'])))
        else:
            validated['top_k'] = 40
            
        # Max tokens: Maximum tokens to generate (1-4096)
        if 'max_tokens' in params:
            validated['max_tokens'] = max(1, min(4096, int(params['max_tokens'])))
        else:
            validated['max_tokens'] = 256
            
        # Frequency penalty: Penalize repeated tokens (-2.0 to 2.0)
        if 'frequency_penalty' in params:
            validated['frequency_penalty'] = max(-2.0, min(2.0, float(params['frequency_penalty'])))
        else:
            validated['frequency_penalty'] = 0.0
            
        # Presence penalty: Penalize new topics (-2.0 to 2.0)
        if 'presence_penalty' in params:
            validated['presence_penalty'] = max(-2.0, min(2.0, float(params['presence_penalty'])))
        else:
            validated['presence_penalty'] = 0.0
            
        # Repeat penalty: Penalty for repetition (0.0-2.0)
        if 'repeat_penalty' in params:
            validated['repeat_penalty'] = max(0.0, min(2.0, float(params['repeat_penalty'])))
        else:
            validated['repeat_penalty'] = 1.1
            
        # Stream: Whether to stream response
        validated['stream'] = bool(params.get('stream', False))
        
        # Stop sequences
        if 'stop' in params:
            if isinstance(params['stop'], list):
                validated['stop'] = params['stop'][:10]  # Limit to 10 stop sequences
            elif isinstance(params['stop'], str):
                validated['stop'] = [params['stop']]
        
        # Seed for reproducible outputs
        if 'seed' in params:
            validated['seed'] = int(params['seed'])
            
        return validated

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check if LM Studio is accessible
        response = requests.get(f"{LM_STUDIO_URL}/models", timeout=5)
        if response.status_code == 200:
            return jsonify({
                "status": "healthy",
                "lm_studio_connected": True,
                "available_models": response.json().get('data', [])
            })
        else:
            return jsonify({
                "status": "partial",
                "lm_studio_connected": False,
                "message": "LM Studio not accessible"
            }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "lm_studio_connected": False,
            "error": str(e)
        }), 503

@app.route('/models', methods=['GET'])
def get_models():
    """Get available models from LM Studio"""
    try:
        response = requests.get(f"{LM_STUDIO_URL}/models", timeout=10)
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch models"}), 500
    except Exception as e:
        logger.error(f"Error fetching models: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat/completions', methods=['POST'])
def chat_completion():
    """Main chat completion endpoint with parameter validation"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        # Validate required fields
        if 'messages' not in data:
            return jsonify({"error": "Messages field is required"}), 400
            
        if not isinstance(data['messages'], list) or not data['messages']:
            return jsonify({"error": "Messages must be a non-empty array"}), 400
            
        # Validate and sanitize parameters
        validator = LLMParameterValidator()
        validated_params = validator.validate_parameters(data)
        
        # Construct request to LM Studio
        lm_request = {
            "model": data.get("model", "local-model"),
            "messages": data["messages"],
            **validated_params
        }
        
        # Log the request (without sensitive data)
        logger.info(f"Processing chat completion with {len(data['messages'])} messages")
        
        # Make request to LM Studio
        response = requests.post(
            f"{LM_STUDIO_URL}/chat/completions",
            json=lm_request,
            headers={"Content-Type": "application/json"},
            timeout=120  # 2 minutes timeout
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            logger.error(f"LM Studio error: {response.status_code} - {response.text}")
            return jsonify({
                "error": "LM Studio request failed",
                "status_code": response.status_code,
                "details": response.text
            }), response.status_code
            
    except requests.RequestException as e:
        logger.error(f"Request error: {e}")
        return jsonify({"error": "Failed to connect to LM Studio"}), 503
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/completions', methods=['POST'])
def text_completion():
    """Text completion endpoint (legacy format)"""
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "Prompt field is required"}), 400
            
        # Validate and sanitize parameters
        validator = LLMParameterValidator()
        validated_params = validator.validate_parameters(data)
        
        # Construct request
        lm_request = {
            "model": data.get("model", "local-model"),
            "prompt": data["prompt"],
            **validated_params
        }
        
        response = requests.post(
            f"{LM_STUDIO_URL}/completions",
            json=lm_request,
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({
                "error": "LM Studio request failed",
                "status_code": response.status_code
            }), response.status_code
            
    except Exception as e:
        logger.error(f"Error in text completion: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/parameters/validate', methods=['POST'])
def validate_parameters():
    """Validate parameters without making a completion request"""
    try:
        data = request.get_json()
        validator = LLMParameterValidator()
        validated_params = validator.validate_parameters(data or {})
        
        return jsonify({
            "valid": True,
            "parameters": validated_params,
            "message": "Parameters validated successfully"
        })
    except Exception as e:
        return jsonify({
            "valid": False,
            "error": str(e)
        }), 400

@app.route('/parameters/defaults', methods=['GET'])
def get_default_parameters():
    """Get default parameter values"""
    validator = LLMParameterValidator()
    defaults = validator.validate_parameters({})
    
    return jsonify({
        "defaults": defaults,
        "parameter_info": {
            "temperature": {
                "description": "Controls randomness in output",
                "range": "0.0-2.0",
                "default": 0.7
            },
            "top_p": {
                "description": "Nucleus sampling parameter",
                "range": "0.0-1.0",
                "default": 0.9
            },
            "top_k": {
                "description": "Top-k sampling parameter",
                "range": "1-100",
                "default": 40
            },
            "max_tokens": {
                "description": "Maximum tokens to generate",
                "range": "1-4096",
                "default": 256
            },
            "frequency_penalty": {
                "description": "Penalize repeated tokens",
                "range": "-2.0 to 2.0",
                "default": 0.0
            },
            "presence_penalty": {
                "description": "Penalize new topics",
                "range": "-2.0 to 2.0",
                "default": 0.0
            },
            "repeat_penalty": {
                "description": "Penalty for repetition",
                "range": "0.0-2.0",
                "default": 1.1
            }
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    
    print(f"Starting Flask LLM API Server on port {port}")
    print(f"LM Studio URL: {LM_STUDIO_URL}")
    print(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)