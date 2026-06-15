import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY)
    }
    return resend
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

export async function sendVerificationEmail(to: string, code: string) {
    await getResend().emails.send({
        from: FROM,
        to,
        subject: 'Verify your email — Conspiracy Barbell',
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h1 style="color: #1a1a1a;">Verify your email</h1>
                <p style="color: #555; font-size: 16px;">
                    Use the code below to verify your email address and finish creating your account.
                </p>
                <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">
                        ${code}
                    </span>
                </div>
                <p style="color: #888; font-size: 14px;">
                    This code expires in 10 minutes. If you didn't create an account, you can ignore this email.
                </p>
            </div>
        `,
    })
}
