import { FREE_LIMIT } from '@/features/pro/limit';
import { PRO_PRICE } from '@/features/pro/purchase';

/** Where people can write about privacy or the terms. Empty until a support address is chosen. */
export const CONTACT_EMAIL = '';

export type LegalDocId = 'privacy' | 'terms';

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDoc = {
  id: LegalDocId;
  title: string;
  /** Shown as "Last updated …"; change it whenever the text changes. */
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const contact = CONTACT_EMAIL
  ? `Write to ${CONTACT_EMAIL}.`
  : 'Use the support contact on lapse.’s App Store or Google Play page.';

const privacy: LegalDoc = {
  id: 'privacy',
  title: 'Privacy Policy',
  updated: 'October 18, 2026',
  intro:
    'lapse. keeps track of your subscriptions on your phone. It has no account and no server of its own, and it never connects to your bank. This policy explains what that means for your data.',
  sections: [
    {
      heading: 'What stays on your phone',
      paragraphs: [
        'Everything you enter stays on your phone: the subscriptions you track, their prices and dates, trials, the savings from what you cancel, and your settings. In the App Store and Google Play versions it is saved in an encrypted database, and the key is kept in the iPhone Keychain or Android Keystore.',
        'We never see this data. It is not uploaded, sold or shared, and it is not used for ads.',
      ],
    },
    {
      heading: 'What lapse. doesn’t collect',
      bullets: [
        'No account, name, email address or phone number.',
        'No bank, card or payment details. lapse. never connects to your bank.',
        'No location, contacts or photos.',
        'No analytics, tracking or advertising identifiers.',
      ],
    },
    {
      heading: 'Buying Pro',
      paragraphs: [
        `Pro is a one-time purchase of ${PRO_PRICE} (or the local price) made through the App Store or Google Play. Apple or Google handle the payment under their own privacy policies; lapse. never sees your payment details.`,
        'To confirm and restore your purchase, lapse. uses RevenueCat, a purchase service. RevenueCat receives a random ID made for this app, your purchase receipts, and basic device details such as the app version, operating system and country. It does not receive your subscriptions or anything else you track. See revenuecat.com/privacy.',
      ],
    },
    {
      heading: 'Reminders, Face ID and sharing',
      bullets: [
        'Reminders are scheduled on your phone. They are not sent from a server.',
        'Face ID (or your phone’s fingerprint or passcode) is checked by the phone. lapse. only learns whether it worked.',
        'Export as CSV makes a file only when you ask for it, and you choose where it goes.',
        'Links to cancel pages, App Store or Google Play subscriptions, or a web search open in your browser, which follows its own policy.',
      ],
    },
    {
      heading: 'Your choices',
      paragraphs: [
        'You can edit or delete any subscription at any time. Profile › Clear all data deletes everything lapse. saved on your phone, and deleting the app does the same. You can turn reminders and the Face ID lock off in Profile or in your phone’s settings.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: ['lapse. is not directed at children under 13 and does not knowingly collect their data.'],
    },
    {
      heading: 'Changes and contact',
      paragraphs: [
        'If this policy changes, the new version will be in the app with a new date. For questions about privacy: ' +
          contact,
      ],
    },
  ],
};

const terms: LegalDoc = {
  id: 'terms',
  title: 'Terms of Use',
  updated: 'October 18, 2026',
  intro:
    'These terms apply when you use lapse. By using the app you agree to them. If you got lapse. from the App Store, Apple’s Licensed Application End User License Agreement also applies.',
  sections: [
    {
      heading: 'What lapse. does',
      paragraphs: [
        'lapse. helps you keep track of subscriptions and free trials and reminds you before they charge. It works with what you enter. It does not see your bank or your accounts with other services, and it cannot cancel anything for you.',
      ],
    },
    {
      heading: 'Reminders and estimates',
      paragraphs: [
        'Prices, dates, totals and savings are estimates based on what you enter. Services change their prices and billing dates, and reminders depend on your phone’s notification settings. Always check with the service before you rely on a date or amount. lapse. is not responsible for charges you didn’t cancel in time.',
      ],
    },
    {
      heading: 'Cancel steps and links',
      paragraphs: [
        'Steps for cancelling and links to other services are given as help and may be out of date. The other service decides how cancelling works, and its own terms apply.',
      ],
    },
    {
      heading: 'Pro',
      bullets: [
        `The free version tracks up to ${FREE_LIMIT} subscriptions. Pro removes that limit.`,
        `Pro is a one-time purchase of ${PRO_PRICE} (or the local price). It is not a subscription and never renews.`,
        'It is sold through the App Store or Google Play, and their rules on payment and refunds apply. Ask Apple or Google for a refund.',
        'Use Restore purchase to get Pro back on a new phone or after reinstalling, with the same App Store or Google Play account.',
        'Features listed as coming to Pro arrive in updates when they are ready.',
      ],
    },
    {
      heading: 'Your data',
      paragraphs: [
        'Your data stays on your phone, as described in the Privacy Policy. Because there is no backup on our side, deleting the app or clearing its data removes it for good. Export as CSV keeps a copy.',
      ],
    },
    {
      heading: 'Fair use',
      paragraphs: [
        'Don’t copy, resell or reverse-engineer the app except where the law allows it. Service names and logos belong to their owners and are shown only to identify them.',
      ],
    },
    {
      heading: 'No warranty',
      paragraphs: [
        'lapse. is provided as it is. As far as the law allows, we are not liable for indirect losses or for charges made by other services. Nothing in these terms limits rights you have under consumer law where you live.',
      ],
    },
    {
      heading: 'Changes and contact',
      paragraphs: [
        'We may update these terms; the new version will be in the app with a new date. For questions: ' + contact,
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = { privacy, terms };
