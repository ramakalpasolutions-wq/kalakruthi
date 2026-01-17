import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

const PricingSchema = new mongoose.Schema(
  {
    cameras: Object,
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: 'quotation_pricing' }
)

const Pricing =
  mongoose.models.QuotationPricing ||
  mongoose.model('QuotationPricing', PricingSchema)

async function connectDB() {
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(process.env.MONGODB_URI)
}

/* ===== GET latest pricing ===== */
export async function GET() {
  try {
    await connectDB()
    const latest = await Pricing.findOne().sort({ updatedAt: -1 })
    return NextResponse.json(latest || {})
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/* ===== SAVE pricing ===== */
export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()

    await Pricing.deleteMany({}) // keep only latest
    const saved = await Pricing.create(body)

    return NextResponse.json(saved)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
