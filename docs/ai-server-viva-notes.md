# AquaLux AI Server - Viva Notes

## What was implemented?

The AI support module uses a small Python Flask server. Users can either complete the structured recommendation form or chat naturally with the AquaLux AI Assistant. The server applies rule-based conditions and returns the recommended package, price, estimated time and reason as JSON. It can also count stored bookings to identify the busiest weekday.

## Why is this an AI feature?

It is a simple rule-based expert system. It uses predefined knowledge and `if` conditions to make a decision. This matches the first-version recommendation in the proposal and is realistic for a student project. A machine-learning model can replace the rules later when enough real booking data is available.

## Data flow

1. User chooses vehicle details in `index.html`.
2. `js/main.js` sends a POST request using `fetch()`.
3. `server.py` validates the input and applies `PACKAGE_RULES`.
4. Flask returns a JSON response.
5. JavaScript displays the recommendation without reloading the page.

The dedicated `ai-assistant.html` page sends natural-language messages to `/api/assistant`. The server identifies vehicle words such as car, motorcycle, van and SUV, detects phrases such as "very dirty" or "interior cleaning", and then uses the same proposal rules.

## Important files

- `server.py` - Flask server, rules and API routes.
- `requirements.txt` - Python package requirement.
- `js/main.js` - public AI form and changing vehicle preview.
- `ai-assistant.html` - full AquaLux conversational AI interface.
- `js/ai-assistant.js` - chat messages, quick prompts and API requests.
- `css/ai-assistant.css` - responsive AI workspace design.
- `assets/js/ai-recommendation.js` - staff AI page connection.
- `index.html` - public AI support interface.

## Possible viva questions

**Why did you use Flask?**  
Flask is lightweight, easy to understand and suitable for a small Python API.

**What is an API endpoint?**  
It is a URL that receives or returns data. This project uses `/api/recommend`.

**What format is used between frontend and server?**  
JSON is used for both the request and response.

**How can this be improved later?**  
Store real recommendations and booking history in a database, train a small model, add authentication and deploy the Flask server.
