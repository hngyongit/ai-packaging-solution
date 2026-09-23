// self-check: node/npx tsx scripts/otp-selfcheck.mts
import assert from 'node:assert'
import { newOtpCode, hashOtp, otpPolicy } from '../src/lib/mail/otp'

const code = newOtpCode()
assert.match(code, /^\d{6}$/, 'OTP phải đúng 6 chữ số')
assert.equal(hashOtp('u1', code), hashOtp('u1', code), 'hash tất định')
assert.notEqual(hashOtp('u1', code), hashOtp('u2', code), 'hash gắn theo user id')
assert.notEqual(hashOtp('u1', code), hashOtp('u1', newOtpCode()), 'mã khác → hash khác')
// phân phối: 2000 mã phải phủ nhiều giá trị
const set = new Set(Array.from({ length: 2000 }, newOtpCode))
assert.ok(set.size > 1900, `randomInt không lặp nhiều: ${set.size}`)
assert.equal(otpPolicy.MAX_ATTEMPTS, 5)

console.log('otp self-check: OK')
