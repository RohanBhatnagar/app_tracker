from flask import jsonify, request, make_response
import os, base64, re
from openai import OpenAI
from dotenv import load_dotenv
from flask_jwt_extended import jwt_required
from flask_restx import Namespace, Resource

load_dotenv()

openai_ns = Namespace('openai', description="OpenAI Operations")

def get_openai_client():
    api_key = os.getenv('OPENAI_API_KEY')
    organization = os.getenv('ORGANIZATION')
    project = os.getenv('PROJECT')

    if not api_key:
        raise RuntimeError('OPENAI_API_KEY is not configured.')

    return OpenAI(
        api_key=api_key,
        organization=organization,
        project=project,
    )

@openai_ns.route('/entities')
class Entities(Resource):
    @jwt_required()
    def post(self,):
        data = request.get_json()
        messages = data.get('messages')
        extracted_responses = [] 
        client = get_openai_client()
        for message in messages:
            subject = message['subject']
            body = message['body']['data']
            try: 
                system_message = "You are an email assistant."
                body = process_body(body)
                user_prompt = f"""
                    You MUST return an array formatted ["company", "role", "status"], with no additional formatting. Make sure entities are in double quotes.
                    Status can be a "rejection" (if company is moving forward with others or role is closed), "moving on" (moving on to next steps, i.e. selected for an online ASSESSMENT or interview), or  "pending" (if email confirms application). 
                    Role should be specific, including term, location, or role number, if provided. Company and role should be separate. 
                    Extract company, role, status from the following: 
                    {subject, body}
                    If you are unable extract a field, give it the value null. If the email is not an internship confirmation or status update, reply null for all fields. 
                    Take your time, and make sure you are confident in your answer.
                """
                messages = [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_prompt}
                ]
                response = client.chat.completions.create(
                    messages=messages,
                    model="gpt-3.5-turbo-0125",
                )
                ents = extract_response(response)
                extracted_responses.append([ents, message['id']])

            except Exception:
                print("Error extracting from ", message)
            
        return make_response(jsonify({"entities": extracted_responses}), 200)

def extract_response(chat_completion):
    if chat_completion.choices and len(chat_completion.choices) > 0:
        choice = chat_completion.choices[0]
        if choice.message and choice.message.content:
            return choice.message.content
    return [None, None, None]

# needs to be tested
def process_body(body):
    decoded = decode_base64(body)

    remove_links = re.compile(r'http[s]?://\S+')
    remove_dash = re.compile(r'-')
    remove_large_whitespace = re.compile(r'(\t|\r|\n)|(\s{3,})')
    remove_social_media = re.compile(r'\b(linkedin|instagram|twitter|youtube|facebook)\_icon?\b', re.IGNORECASE)
    remove_stars = re.compile(r'\*')
    remove_css = re.compile(r'({.*})')
    remove_html = re.compile(r'<[^>]+>')
    remove_carrot = re.compile(r'<')
    remove_brackets = re.compile(r'\[\]')
    remove_parentheses = re.compile(r'\(\)')

    exprs = [remove_links, remove_dash, remove_large_whitespace, remove_social_media, remove_stars, remove_css, remove_parentheses,remove_html, remove_carrot, remove_brackets]

    for expr in exprs: 
        decoded = expr.sub('', decoded)

    return decoded

def decode_base64(data):
    try:    
        encoded_str = (base64.urlsafe_b64decode(data)).decode("utf-8")
        return encoded_str
    except (base64.binascii.Error, UnicodeDecodeError) as e:
        print("Failed to decode base64 string:", e)
        return ""
