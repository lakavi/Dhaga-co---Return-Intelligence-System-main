export interface ChatMessage {
  sender: 'bot' | 'customer' | 'system';
  text: string;
  time: string;
  actionButtons?: string[];
}

export interface CallLog {
  timestamp: string;
  durationSeconds: number;
  status: 'completed' | 'in_progress' | 'unanswered' | 'scheduled';
  transcript: Array<{ speaker: 'AI Agent (Maya)' | 'Customer'; text: string }>;
  callOutcome: string;
}

export interface ResolutionCase {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  orderId: string;
  sku: string;
  title: string;
  sizeOrdered: string;
  suggestedExchangeSize: string;
  hubName: string;
  hubStock: number;
  problemCategory: 'size_too_small' | 'size_too_large' | 'damage_or_stitch' | 'fabric_or_other';
  customerComment: string;
  itemValue: number;
  reverseFreightCost: number;
  stage: 'whatsapp_intercept' | 'voice_call_triggered' | 'doorstep_exchange_confirmed' | 'rto_initiated';
  interceptSeconds: number;
  timeElapsedMinutes: number;
  whatsappChat: ChatMessage[];
  callLog?: CallLog;
  reverseFreightSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentConfig {
  interceptDelaySeconds: number;
  voiceCallTimeoutHours: number;
  doorstepIncentiveWallet: number;
  voicePersona: 'Maya (Hindi/Hinglish)' | 'Aditi (English/Hindi)' | 'Rohit (Vernacular)';
  autoRTOOnNoAnswer: boolean;
}

export const agentConfig: AgentConfig = {
  interceptDelaySeconds: 15,
  voiceCallTimeoutHours: 4,
  doorstepIncentiveWallet: 100,
  voicePersona: 'Maya (Hindi/Hinglish)',
  autoRTOOnNoAnswer: true,
};

let casesStore: ResolutionCase[] = [
  {
    id: 'CASE-701',
    customerName: 'Priya Sharma',
    phone: '+91 98452 33104',
    city: 'Bengaluru (Indiranagar)',
    orderId: 'DH-9102',
    sku: 'KURTI123',
    title: 'Jaipur Cotton Anarkali Kurti',
    sizeOrdered: 'M',
    suggestedExchangeSize: 'L (+1 Size)',
    hubName: 'Koramangala Hub (3.2 km away)',
    hubStock: 6,
    problemCategory: 'size_too_small',
    customerComment: 'shrit but chota h, shoulder tight ho raha hai',
    itemValue: 1299,
    reverseFreightCost: 140,
    stage: 'doorstep_exchange_confirmed',
    interceptSeconds: 11,
    timeElapsedMinutes: 18,
    reverseFreightSaved: true,
    createdAt: 'Today, 10:15 AM',
    updatedAt: 'Today, 10:27 AM',
    whatsappChat: [
      {
        sender: 'system',
        text: '⚡ Autonomous Agent intercepted return request in 11 seconds. Local Hub inventory checked: 6 units of Size L ready.',
        time: '10:15:11 AM',
      },
      {
        sender: 'bot',
        text: 'Namaste Priya ji! 🙏 We noticed you initiated a return for your Jaipur Cotton Kurti (Size M) because the shoulder fit feels tight. We are so sorry about that!',
        time: '10:15:12 AM',
      },
      {
        sender: 'bot',
        text: 'Our Koramangala Hub is just 3.2 km away and has Size L in stock right now. Instead of waiting 7 days for a refund, our delivery partner can do a 1-Click Doorstep Swap tomorrow at 11 AM: hand over Size M and receive fresh Size L instantly! Plus we will add ₹100 Dhaga Wallet credit as an apology.',
        time: '10:15:13 AM',
        actionButtons: ['✅ Accept Doorstep Swap (Size L)', '🔄 Choose Another Slot', '❌ Prefer Refund'],
      },
      {
        sender: 'customer',
        text: 'Haan Size L would be great! Pls send tomorrow morning.',
        time: '10:24:40 AM',
      },
      {
        sender: 'bot',
        text: 'Awesome Priya ji! 🌸 Doorstep exchange confirmed for tomorrow 11:00 AM. Rider Ramesh will bring Size L and collect Size M. ₹100 credit added to your Dhaga account! Tracking ID: DH-SWP-491.',
        time: '10:25:01 AM',
      },
    ],
  },
  {
    id: 'CASE-702',
    customerName: 'Rohan Gupta',
    phone: '+91 97110 54219',
    city: 'Bengaluru (HSR Layout)',
    orderId: 'DH-9144',
    sku: 'SHIRT440',
    title: 'Indigo Handloom Casual Shirt',
    sizeOrdered: 'XL',
    suggestedExchangeSize: 'L (-1 Size)',
    hubName: 'HSR Hub (1.8 km away)',
    hubStock: 4,
    problemCategory: 'size_too_large',
    customerComment: 'bahut bada h, office shirt jaisa look nahi aa raha size issue',
    itemValue: 1450,
    reverseFreightCost: 140,
    stage: 'whatsapp_intercept',
    interceptSeconds: 9,
    timeElapsedMinutes: 45,
    reverseFreightSaved: false,
    createdAt: 'Today, 11:30 AM',
    updatedAt: 'Today, 11:30 AM',
    whatsappChat: [
      {
        sender: 'system',
        text: '⚡ Intercepted in 9 seconds. HSR Hub has 4 units of Size L in stock. WhatsApp offer dispatched.',
        time: '11:30:09 AM',
      },
      {
        sender: 'bot',
        text: 'Hello Rohan ji! We see you asked to return your Indigo Handloom Shirt (Size XL) due to loose sizing. We have fresh Size L ready at our HSR micro-hub!',
        time: '11:30:10 AM',
      },
      {
        sender: 'bot',
        text: 'Would you prefer a 1-Click Doorstep Exchange today evening? Our rider will do a direct swap at your doorstep in under 4 hours, saving you return delays. We will also add ₹100 Dhaga coins.',
        time: '11:30:11 AM',
        actionButtons: ['✅ Confirm Doorstep Swap to Size L', '⏱ Wait for 4h Voice Follow-up', '❌ Proceed to RTO Refund'],
      },
    ],
  },
  {
    id: 'CASE-703',
    customerName: 'Meera Iyer',
    phone: '+91 98204 88291',
    city: 'Bengaluru (Whitefield)',
    orderId: 'DH-9088',
    sku: 'KURTI991',
    title: 'Tiruppur Chanderi Silk Kurti',
    sizeOrdered: 'M',
    suggestedExchangeSize: 'L (+1 Size)',
    hubName: 'Whitefield Hub (2.4 km away)',
    hubStock: 3,
    problemCategory: 'size_too_small',
    customerComment: 'chart galat hai, fitting bahut choti hai M ki',
    itemValue: 1699,
    reverseFreightCost: 140,
    stage: 'doorstep_exchange_confirmed',
    interceptSeconds: 14,
    timeElapsedMinutes: 260,
    reverseFreightSaved: true,
    createdAt: 'Today, 08:00 AM',
    updatedAt: 'Today, 12:15 PM',
    whatsappChat: [
      {
        sender: 'system',
        text: '⚡ WhatsApp offer sent at 08:00:14 AM. No buyer response after 4 hours. Automated escalation triggered to AI Voice Calling Agent.',
        time: '08:00:14 AM',
      },
      {
        sender: 'bot',
        text: 'Namaste Meera ji! We noticed your return for Chanderi Silk Kurti. Would you like our Whitefield hub to deliver Size L directly to your doorstep today?',
        time: '08:00:15 AM',
      },
      {
        sender: 'system',
        text: '⏳ 4 Hours Elapsed without confirmation. Autonomous AI Voice Calling Agent dialed +91 98204 88291.',
        time: '12:02:00 PM',
      },
    ],
    callLog: {
      timestamp: 'Today, 12:02 PM',
      durationSeconds: 78,
      status: 'completed',
      callOutcome: 'Customer confirmed doorstep swap to Size L over voice call',
      transcript: [
        {
          speaker: 'AI Agent (Maya)',
          text: 'Namaste Meera ji! Main Dhaga & Co customer care se Maya bol rahi hoon. Aapne morning mein Chanderi Kurti return request raise ki thi fitting ke karan.',
        },
        {
          speaker: 'Customer',
          text: 'Haanji, wo chart ke hisaab se M order kiya tha par chest aur waist pe bohot tight hai.',
        },
        {
          speaker: 'AI Agent (Maya)',
          text: 'Bilkul Meera ji, hum samajh sakte hain. Hamare Whitefield hub mein Size L available hai. Kya hum kal subah 10 baje doorstep exchange bhej dein? Delivery boy L size de dega aur M le lega, zero hassle!',
        },
        {
          speaker: 'Customer',
          text: 'Achha direct swap ho jayega? Haan wo better hai, return bhej ke fir refund ka wait nahi karna padega. Kal subah bhej dijiye.',
        },
        {
          speaker: 'AI Agent (Maya)',
          text: 'Bahut badhiya! Kal 10 AM ka doorstep swap confirm kar diya hai aur ₹100 wallet cashback bhi credit kar diya hai. Dhanyawad!',
        },
      ],
    },
  },
  {
    id: 'CASE-704',
    customerName: 'Suresh Pillai',
    phone: '+91 94471 21008',
    city: 'Bengaluru (Peenya)',
    orderId: 'DH-8991',
    sku: 'DUPATTA22',
    title: 'Kota Doria Zari Dupatta',
    sizeOrdered: 'Free',
    suggestedExchangeSize: 'Replacement Unit',
    hubName: 'Peenya Hub (4.1 km away)',
    hubStock: 2,
    problemCategory: 'damage_or_stitch',
    customerComment: 'stitch nikal gyi corner se, damaged piece',
    itemValue: 799,
    reverseFreightCost: 140,
    stage: 'rto_initiated',
    interceptSeconds: 12,
    timeElapsedMinutes: 285,
    reverseFreightSaved: false,
    createdAt: 'Today, 07:15 AM',
    updatedAt: 'Today, 12:00 PM',
    whatsappChat: [
      {
        sender: 'system',
        text: '⚡ WhatsApp offer sent with fresh inspected replacement + ₹100 credit. No response after 4 hours.',
        time: '07:15:12 AM',
      },
      {
        sender: 'bot',
        text: 'Namaste Suresh ji, extremely sorry about the stitching flaw on your Dupatta. Can our Peenya hub bring a quality-checked replacement piece today?',
        time: '07:15:13 AM',
      },
      {
        sender: 'system',
        text: '⏳ 4 Hours elapsed. AI Voice Calling Agent attempted 2 calls at 11:20 AM and 11:45 AM (Ringing, No answer).',
        time: '11:45:00 AM',
      },
      {
        sender: 'system',
        text: '🚨 No response / confirmation received after 4 hours and voice attempts. Autonomous RTO pickup initiated with Delhivery to prevent customer friction.',
        time: '12:00:00 PM',
      },
    ],
    callLog: {
      timestamp: 'Today, 11:45 AM',
      durationSeconds: 0,
      status: 'unanswered',
      callOutcome: '2 call attempts unanswered. Safe fallback: RTO initiated.',
      transcript: [],
    },
  },
];

export function getResolutionCases(): ResolutionCase[] {
  return casesStore;
}

export function getResolutionStats() {
  const total = casesStore.length;
  const doorstepExchanges = casesStore.filter((c) => c.stage === 'doorstep_exchange_confirmed').length;
  const whatsappActive = casesStore.filter((c) => c.stage === 'whatsapp_intercept').length;
  const voiceActive = casesStore.filter((c) => c.stage === 'voice_call_triggered').length;
  const rtoInitiated = casesStore.filter((c) => c.stage === 'rto_initiated').length;

  const totalReverseFreightSaved = casesStore
    .filter((c) => c.reverseFreightSaved)
    .reduce((sum, c) => sum + c.reverseFreightCost, 0);

  const totalGMVRetained = casesStore
    .filter((c) => c.reverseFreightSaved)
    .reduce((sum, c) => sum + c.itemValue, 0);

  const avgIntercept = casesStore.reduce((sum, c) => sum + c.interceptSeconds, 0) / (total || 1);

  return {
    total,
    doorstepExchanges,
    whatsappActive,
    voiceActive,
    rtoInitiated,
    totalReverseFreightSaved,
    totalGMVRetained,
    avgInterceptSeconds: Math.round(avgIntercept * 10) / 10,
    exchangeRatePct: Math.round((doorstepExchanges / (doorstepExchanges + rtoInitiated || 1)) * 100),
    config: agentConfig,
  };
}

export function updateCaseStage(
  id: string,
  newStage: 'doorstep_exchange_confirmed' | 'voice_call_triggered' | 'rto_initiated'
): ResolutionCase | null {
  const found = casesStore.find((c) => c.id === id);
  if (!found) return null;

  found.stage = newStage;
  found.updatedAt = 'Just now';

  if (newStage === 'doorstep_exchange_confirmed') {
    found.reverseFreightSaved = true;
    found.whatsappChat.push({
      sender: 'bot',
      text: `✅ Doorstep Exchange confirmed for ${found.suggestedExchangeSize}! Nearest hub (${found.hubName}) dispatched delivery partner. Reverse freight avoided.`,
      time: 'Just now',
    });
  } else if (newStage === 'voice_call_triggered') {
    found.whatsappChat.push({
      sender: 'system',
      text: '⏱ 4 Hours reached without WhatsApp confirmation. AI Voice Calling Agent Maya dialed customer.',
      time: 'Just now',
    });
    found.callLog = {
      timestamp: 'Just now',
      durationSeconds: 64,
      status: 'completed',
      callOutcome: 'AI voice call placed. Awaiting customer confirmation or auto-RTO fallback.',
      transcript: [
        {
          speaker: 'AI Agent (Maya)',
          text: `Namaste ${found.customerName} ji! Main Dhaga & Co se Maya bol rahi hoon. Aapke return request ke regarding call kiya hai.`,
        },
        {
          speaker: 'Customer',
          text: 'Haan boliye, kya hua?',
        },
        {
          speaker: 'AI Agent (Maya)',
          text: `Aapka ${found.title} ka size issue tha. Hamare ${found.hubName} se hum kal subah doorstep exchange bhej sakte hain ${found.suggestedExchangeSize} mein. Kya main yeh confirm kar doon?`,
        },
      ],
    };
  } else if (newStage === 'rto_initiated') {
    found.reverseFreightSaved = false;
    found.whatsappChat.push({
      sender: 'system',
      text: '🚨 No confirmation received within SLA. Autonomous RTO pickup initiated. Reverse courier scheduled.',
      time: 'Just now',
    });
  }

  return found;
}

export function simulateNewReturn(payload: {
  customerName: string;
  phone?: string;
  sku: string;
  size: string;
  comment: string;
  city?: string;
}): ResolutionCase {
  const isSmall = payload.comment.toLowerCase().includes('chota') ||
    payload.comment.toLowerCase().includes('small') ||
    payload.comment.toLowerCase().includes('tight');

  const isLarge = payload.comment.toLowerCase().includes('bada') ||
    payload.comment.toLowerCase().includes('large') ||
    payload.comment.toLowerCase().includes('loose');

  let exchangeSize = 'Size L (+1 Size)';
  let category: ResolutionCase['problemCategory'] = 'size_too_small';

  if (isSmall) {
    exchangeSize = payload.size === 'M' ? 'Size L (+1)' : payload.size === 'L' ? 'Size XL (+1)' : 'Size +1';
    category = 'size_too_small';
  } else if (isLarge) {
    exchangeSize = payload.size === 'XL' ? 'Size L (-1)' : payload.size === 'L' ? 'Size M (-1)' : 'Size -1';
    category = 'size_too_large';
  } else {
    category = 'fabric_or_other';
    exchangeSize = 'Fresh Inspected Unit';
  }

  const hubs = [
    'Koramangala Hub (3.2 km)',
    'HSR Layout Hub (2.1 km)',
    'Indiranagar Hub (1.5 km)',
    'Whitefield Hub (4.8 km)',
  ];
  const chosenHub = hubs[Math.floor(Math.random() * hubs.length)];
  const intercept = Math.floor(Math.random() * 6) + 8; // 8-13 seconds

  const newCase: ResolutionCase = {
    id: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: payload.customerName || 'Customer',
    phone: payload.phone || '+91 98450 ' + Math.floor(10000 + Math.random() * 90000),
    city: payload.city || 'Bengaluru',
    orderId: `DH-${Math.floor(8000 + Math.random() * 2000)}`,
    sku: payload.sku,
    title: payload.sku.startsWith('KURTI') ? 'Embroidered Cotton Kurti' : 'Handloom Cotton Apparel',
    sizeOrdered: payload.size,
    suggestedExchangeSize: exchangeSize,
    hubName: chosenHub,
    hubStock: Math.floor(Math.random() * 5) + 3,
    problemCategory: category,
    customerComment: payload.comment,
    itemValue: 1299,
    reverseFreightCost: 140,
    stage: 'whatsapp_intercept',
    interceptSeconds: intercept,
    timeElapsedMinutes: 1,
    reverseFreightSaved: false,
    createdAt: 'Just now',
    updatedAt: 'Just now',
    whatsappChat: [
      {
        sender: 'system',
        text: `⚡ Autonomous Negotiation Agent intercepted return in ${intercept}s. Nearest hub inventory verified.`,
        time: 'Just now',
      },
      {
        sender: 'bot',
        text: `Namaste ${payload.customerName}! 🙏 We saw your return request for ${payload.sku} (${payload.size}). Because you mentioned: "${payload.comment}", we checked ${chosenHub}.`,
        time: 'Just now',
      },
      {
        sender: 'bot',
        text: `We have ${exchangeSize} in stock! Instead of waiting for a courier return and refund, would you like a 1-Click Doorstep Swap tomorrow? Zero return fee + ₹100 Dhaga wallet bonus!`,
        time: 'Just now',
        actionButtons: [`✅ Confirm Doorstep Swap (${exchangeSize})`, '🔄 Change Delivery Slot', '❌ Continue Return/Refund'],
      },
    ],
  };

  casesStore.unshift(newCase);
  return newCase;
}
