<template>
  <div>
    <Navbar />
    <div class="referral-page">
      <div class="referral-card">
        <div class="ref-icon">🎁</div>
        <h1>Invite Friends, Get Rewarded</h1>
        <p>Share your referral link. Every person who signs up using your link gives you <strong>+7 free days</strong> on your subscription.</p>

        <!-- Stats -->
        <div class="ref-stats">
          <div class="ref-stat">
            <div class="ref-stat-val">{{ referralCount }}</div>
            <div class="ref-stat-label">Friends Referred</div>
          </div>
          <div class="ref-stat">
            <div class="ref-stat-val">{{ referralCount * 7 }}</div>
            <div class="ref-stat-label">Free Days Earned</div>
          </div>
        </div>

        <!-- Referral link -->
        <div class="ref-link-wrap">
          <div class="ref-label">Your Referral Link</div>
          <div class="ref-link-box">
            <span class="ref-link-text">{{ referralLink }}</span>
            <button class="btn btn-primary btn-sm" @click="copyLink">
              {{ copied ? '✓ Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Share buttons -->
        <div class="ref-share">
          <div class="ref-label">Share via</div>
          <div class="ref-share-btns">
            <a :href="whatsappShare" target="_blank" class="btn btn-whatsapp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a :href="twitterShare" target="_blank" class="btn btn-ghost">
              𝕏 Twitter
            </a>
          </div>
        </div>

        <!-- How it works -->
        <div class="ref-how">
          <div class="ref-how-title">How it works</div>
          <div class="ref-step"><span class="ref-step-num">1</span> Share your link with friends</div>
          <div class="ref-step"><span class="ref-step-num">2</span> They sign up using your link</div>
          <div class="ref-step"><span class="ref-step-num">3</span> You get +7 free days on your subscription automatically</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import { auth } from '@/stores/auth'
import { supabase } from '@/supabase'
import { generateReferralCode, getReferralLink } from '@/utils/referral'

const copied        = ref(false)
const referralCount = ref(0)

const referralCode = computed(() => {
  if (!auth.user) return ''
  return auth.profile?.referral_code || generateReferralCode(auth.user.id)
})

const referralLink = computed(() => getReferralLink(referralCode.value))

const whatsappShare = computed(() =>
  `https://wa.me/?text=${encodeURIComponent(`Join me on TalentHub — Africa's job platform! Sign up here: ${referralLink.value}`)}`
)
const twitterShare = computed(() =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Looking for work or hiring in Africa? Check out TalentHub! ${referralLink.value}`)}`
)

onMounted(async () => {
  if (!auth.user) return

  // Save referral code to profile if not set
  if (!auth.profile?.referral_code) {
    const code = generateReferralCode(auth.user.id)
    await supabase.from('profiles').update({ referral_code: code }).eq('id', auth.user.id)
    if (auth.profile) auth.profile.referral_code = code
  }

  referralCount.value = auth.profile?.referral_count || 0
})

async function copyLink() {
  await navigator.clipboard.writeText(referralLink.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>

<style scoped>
.referral-page { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
.referral-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 36px; text-align: center; }
.ref-icon { font-size: 48px; margin-bottom: 16px; }
.referral-card h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
.referral-card p  { font-size: 14px; color: var(--text-dim); margin-bottom: 24px; line-height: 1.6; }
.ref-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
.ref-stat  { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
.ref-stat-val   { font-size: 28px; font-weight: 700; color: var(--green); }
.ref-stat-label { font-size: 12px; color: var(--text-ghost); margin-top: 4px; }
.ref-label { font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; text-align: left; }
.ref-link-wrap { margin-bottom: 20px; }
.ref-link-box { display: flex; align-items: center; gap: 8px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; }
.ref-link-text { flex: 1; font-size: 12px; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.ref-share { margin-bottom: 24px; }
.ref-share-btns { display: flex; gap: 10px; }
.ref-share-btns .btn { flex: 1; justify-content: center; }
.ref-how { background: var(--surface2); border-radius: var(--radius); padding: 16px; text-align: left; }
.ref-how-title { font-size: 13px; font-weight: 600; margin-bottom: 12px; }
.ref-step { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-dim); margin-bottom: 8px; }
.ref-step:last-child { margin-bottom: 0; }
.ref-step-num { width: 22px; height: 22px; border-radius: 50%; background: var(--accent-bg); color: #60a5fa; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
</style>
