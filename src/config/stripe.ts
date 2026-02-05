import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    // Hardcoded Stripe secret key
    const STRIPE_SECRET_KEY = 'sk_test_51Rj1dnBOoulucdCvbGDz4brJYHztkuL80jGSKcnQNT46g9P58pbxY36Lg3yWyMDb6Gwgv5Rr3NDfjvB2HyaDlJP7006wnXEtp1'
    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  }
  return stripeInstance
}

