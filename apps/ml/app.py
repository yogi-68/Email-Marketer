from flask import Flask, request, jsonify
import os
import numpy as np
from datetime import datetime, timedelta
import random

app = Flask(__name__)

# Mock engagement data structure
# In production, this would be loaded from a database
MOCK_ENGAGEMENT_DATA = {}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "ml-sto"}), 200

@app.route('/predict-sto', methods=['POST'])
def predict_sto():
    """
    Send Time Optimization (STO) Prediction Endpoint
    
    Analyzes historical engagement patterns and returns optimal send times
    for each recipient.
    
    Request body:
    {
        "emails": ["user1@example.com", "user2@example.com"],
        "timezone": "UTC",
        "campaignType": "marketing"
    }
    
    Response:
    {
        "predictions": [
            {
                "email": "user1@example.com",
                "optimal_hour": 10,
                "confidence": 0.85,
                "delay_ms": 14400000
            }
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'emails' not in data:
            return jsonify({"error": "emails field is required"}), 400
        
        emails = data['emails']
        timezone = data.get('timezone', 'UTC')
        campaign_type = data.get('campaignType', 'marketing')
        
        predictions = []
        
        for email in emails:
            # Get or generate engagement profile
            profile = get_engagement_profile(email)
            
            # Calculate optimal send hour based on historical patterns
            optimal_hour = calculate_optimal_hour(profile, campaign_type)
            
            # Calculate confidence score
            confidence = calculate_confidence(profile)
            
            # Calculate delay in milliseconds from now
            delay_ms = calculate_delay_ms(optimal_hour)
            
            predictions.append({
                "email": email,
                "optimal_hour": optimal_hour,
                "confidence": round(confidence, 2),
                "delay_ms": delay_ms,
                "profile_strength": profile['strength']
            })
        
        return jsonify({
            "predictions": predictions,
            "model_version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in STO prediction: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

def get_engagement_profile(email):
    """
    Get or generate engagement profile for a user
    
    In production, this would query a database with historical engagement data:
    - Open times (hourly distribution)
    - Click times (hourly distribution)
    - Device types
    - Geographic location
    - Engagement velocity
    """
    if email in MOCK_ENGAGEMENT_DATA:
        return MOCK_ENGAGEMENT_DATA[email]
    
    # Generate synthetic profile with realistic patterns
    # Most people engage more in morning (9-11) and evening (18-20)
    hourly_engagement = np.random.beta(2, 5, 24)  # Skewed distribution
    
    # Add peaks for morning and evening
    hourly_engagement[9:12] += 0.3
    hourly_engagement[18:21] += 0.4
    
    # Normalize
    hourly_engagement = hourly_engagement / hourly_engagement.sum()
    
    profile = {
        "email": email,
        "hourly_engagement": hourly_engagement.tolist(),
        "total_opens": random.randint(10, 500),
        "total_clicks": random.randint(5, 200),
        "strength": "high" if random.random() > 0.5 else "medium"
    }
    
    MOCK_ENGAGEMENT_DATA[email] = profile
    return profile

def calculate_optimal_hour(profile, campaign_type):
    """
    Calculate the optimal send hour based on engagement patterns
    
    Uses hourly engagement distribution to find the hour with
    highest historical engagement probability.
    """
    hourly_engagement = np.array(profile['hourly_engagement'])
    
    # Find hour with maximum engagement
    optimal_hour = int(np.argmax(hourly_engagement))
    
    # Add some randomization to avoid clustering
    # In production, this would use more sophisticated scheduling
    if random.random() > 0.7:
        # Shift by +/- 1 hour with some probability
        optimal_hour = max(0, min(23, optimal_hour + random.choice([-1, 1])))
    
    return optimal_hour

def calculate_confidence(profile):
    """
    Calculate confidence score for the prediction
    
    Based on:
    - Amount of historical data
    - Consistency of engagement patterns
    - Profile strength
    """
    total_interactions = profile['total_opens'] + profile['total_clicks']
    
    if total_interactions < 10:
        return 0.3  # Low confidence
    elif total_interactions < 50:
        return 0.6  # Medium confidence
    else:
        return 0.85  # High confidence

def calculate_delay_ms(optimal_hour):
    """
    Calculate delay in milliseconds until the optimal send time
    
    If optimal hour is in the future today, schedule for today.
    Otherwise, schedule for tomorrow.
    """
    now = datetime.utcnow()
    current_hour = now.hour
    
    # Calculate target time
    if optimal_hour > current_hour:
        # Send today
        target_time = now.replace(hour=optimal_hour, minute=0, second=0, microsecond=0)
    else:
        # Send tomorrow
        tomorrow = now + timedelta(days=1)
        target_time = tomorrow.replace(hour=optimal_hour, minute=0, second=0, microsecond=0)
    
    # Calculate delay in milliseconds
    delay = (target_time - now).total_seconds() * 1000
    
    return int(max(0, delay))

@app.route('/train', methods=['POST'])
def train_model():
    """
    Endpoint to retrain the model with new engagement data
    
    In production, this would:
    1. Fetch recent engagement data from database
    2. Retrain the ML model (scikit-learn, XGBoost, etc.)
    3. Save the new model
    4. Return training metrics
    """
    return jsonify({
        "status": "training_scheduled",
        "message": "Model training endpoint - not implemented in MVP"
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
