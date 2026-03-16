// Countries supported by TalentHub with currency info
export const COUNTRIES = [
  { code: 'RW', name: 'Rwanda',       flag: '🇷🇼', currency: 'RWF', symbol: 'RWF', monthlyFee: 30000 },
  { code: 'KE', name: 'Kenya',        flag: '🇰🇪', currency: 'KES', symbol: 'KSh', monthlyFee: 3000  },
  { code: 'UG', name: 'Uganda',       flag: '🇺🇬', currency: 'UGX', symbol: 'UGX', monthlyFee: 110000},
  { code: 'TZ', name: 'Tanzania',     flag: '🇹🇿', currency: 'TZS', symbol: 'TSh', monthlyFee: 70000 },
  { code: 'NG', name: 'Nigeria',      flag: '🇳🇬', currency: 'NGN', symbol: '₦',   monthlyFee: 15000 },
  { code: 'GH', name: 'Ghana',        flag: '🇬🇭', currency: 'GHS', symbol: 'GH₵', monthlyFee: 350   },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R',   monthlyFee: 550   },
  { code: 'ET', name: 'Ethiopia',     flag: '🇪🇹', currency: 'ETB', symbol: 'ETB', monthlyFee: 1700  },
  { code: 'SN', name: 'Senegal',      flag: '🇸🇳', currency: 'XOF', symbol: 'CFA', monthlyFee: 18000 },
  { code: 'CI', name: 'Côte d\'Ivoire',flag:'🇨🇮', currency: 'XOF', symbol: 'CFA', monthlyFee: 18000 },
]

export function getCountry(code) {
  return COUNTRIES.find(c => c.code === code) || COUNTRIES[0]
}

export function formatAmount(amount, countryCode) {
  const country = getCountry(countryCode)
  return `${country.symbol} ${Number(amount).toLocaleString()}`
}
