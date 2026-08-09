import { site } from '@/lib/site'
import { db } from '@/lib/db/store'
import { USD_TO_NPR } from '@/lib/booking'

// Deterministic bilingual concierge used when the AI Gateway is unavailable.
// Detects Devanagari or common romanized-Nepali tokens and answers accordingly.
function isNepali(q: string) {
  if (/[\u0900-\u097F]/.test(q)) return true
  const romanized = ['kati', 'parcha', 'parchha', 'cha', 'chha', 'kaha', 'kasto', 'ho', 'ramro', 'kotha', 'khana', 'namaste', 'garna', 'milcha']
  const words = q.toLowerCase().split(/\s+/)
  return romanized.filter((r) => words.includes(r)).length >= 1
}

export function fallbackAnswer(q: string): string {
  const ne = isNepali(q)
  const t = q.toLowerCase()
  const priceList = db.rooms
    .map((r) => `${r.name} — $${r.priceUSD}/${ne ? 'रात' : 'night'} (≈ NPR ${Math.round(r.priceUSD * USD_TO_NPR).toLocaleString('en-IN')})`)
    .join('; ')

  if (t.includes('price') || t.includes('rate') || t.includes('cost') || t.includes('kati') || t.includes('मूल्य') || t.includes('कति'))
    return ne
      ? `हाम्रा कोठाहरूको मूल्य: ${priceList}। कर र सेवा शुल्क अलग लाग्छ। "Book a room" मा गएर मिति अनुसार उपलब्धता हेर्न सक्नुहुन्छ।`
      : `Our room rates: ${priceList}. Taxes and service charge apply. Tap "Book a room" to see live availability for your dates.`

  if (t.includes('room') || t.includes('stay') || t.includes('book') || t.includes('kotha') || t.includes('कोठा'))
    return ne
      ? 'हामीसँग Valley View, Bridge Deluxe र Summit Suite कोठाहरू छन् — सबैमा हिमालको दृश्य, न्यानो ओछ्यान र तातो पानीको सुविधा। "Book a room" थिचेर मिति अनुसार बुक गर्नुहोस्।'
      : 'We offer Valley View, Bridge Deluxe and Summit Suite rooms — all with mountain views, warm bedding and hot showers. Tap "Book a room" to check dates and reserve.'

  if (t.includes('breakfast') || t.includes('food') || t.includes('menu') || t.includes('eat') || t.includes('restaurant') || t.includes('khana') || t.includes('खाना'))
    return ne
      ? 'हाम्रो छत रेस्टुरेन्टमा बिहान ६:३० बजेदेखि खाजा, अनि दिनभरि दाल भात, मम, वुड-फायर पिज्जा र न्यानो सुप पाइन्छ। टेबल आरक्षण गर्न सक्नुहुन्छ।'
      : 'Our rooftop restaurant serves breakfast from 6:30am, plus all-day dal bhat, momos, wood-fired pizza and warming soups. You can reserve a table anytime.'

  if (t.includes('location') || t.includes('where') || t.includes('address') || t.includes('kaha') || t.includes('कहाँ'))
    return ne
      ? `हामी ${site.location} मा, अन्नपूर्ण सर्किटमा ${site.altitude} उचाइमा छौं। सम्पर्क पेजमा नक्सा हेर्नुहोस्।`
      : `We're in ${site.location}, right on the Annapurna Circuit at ${site.altitude}. See the Contact page for a map.`

  if (t.includes('trek') || t.includes('hike') || t.includes('acclimat') || t.includes('ट्रेक'))
    return ne
      ? 'पिसाङ अन्नपूर्ण सर्किटको महत्त्वपूर्ण एक्लिमटाइजेसन स्थल हो। हामी गाइड, भरिया र यात्रा योजना मिलाउन सहयोग गर्छौं।'
      : 'Pisang is a key acclimatization stop on the Annapurna Circuit. We help arrange guides, porters and itineraries — ask us anytime.'

  if (t.includes('contact') || t.includes('phone') || t.includes('call') || t.includes('whatsapp'))
    return ne
      ? `फ्रन्ट डेस्कमा ${site.phone} मा सम्पर्क गर्नुहोस्, वा व्हाट्सएपमा सन्देश पठाउनुहोस्।`
      : `Reach the front desk at ${site.phone}, or message us anytime on WhatsApp.`

  return ne
    ? 'नमस्ते! म शेर्पा, तपाईंको कन्सियर्ज। कोठा, भोजन, मूल्य वा ट्रेकिङबारे सोध्नुहोस्।'
    : "Namaste! I'm Sherpa, your concierge. Ask me about rooms, dining, prices or trekking around Pisang."
}
