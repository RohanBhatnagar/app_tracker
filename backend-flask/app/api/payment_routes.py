import os
from flask_jwt_extended import jwt_required
from flask_restx import Namespace, Resource
from dotenv import load_dotenv
import stripe

load_dotenv()

payment_ns = Namespace('payment', description="Payment related operations")

def configure_stripe():
    stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe_secret_key:
        raise RuntimeError('STRIPE_SECRET_KEY is not configured.')

    stripe.api_key = stripe_secret_key

@payment_ns.route('/test', methods=['GET'])
class Test(Resource):
	def get(self):
		return jsonify({'response': 'got to backend'})

@payment_ns.route('/create-checkout-session', methods=['POST'])
class CreateCheckoutSession(Resource):
    def post(self):
        configure_stripe()
        session = stripe.checkout.sessions.create(
            payment_method_types=["card"],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'PRODUCT NAME'
                        },
                        'unit_amount': 100
                    },
                },
            ],
            mode="payment",
            success_url="successurl",
            cancel_url="cancelurl",
        )
        return jsonify({'id': session.id})


@payment_ns.route('/verify-session', methods=['GET'])
class VerifySession(Resource):
    @jwt_required()
    def get(self):
        configure_stripe()
        session_id = request.args.get('session_id')
        session = stripe.checkout.sessions.retrieve(session_id)
        if session['payment_status'] == 'paid':
            return jsonify({'status': 'paid'})
        else:
            return jsonify({'status': 'unpaid'})
