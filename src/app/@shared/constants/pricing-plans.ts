/** Keys sent to PayPal as custom_id and used for optional hosted checkout URLs. */
export type PricingPlanId =
  | 'group-1m'
  | 'group-2m'
  | 'group-3m'
  | 'group-6m'
  | 'group-12m'
  | 'private-30-1'
  | 'private-30-4'
  | 'private-30-8'
  | 'private-30-12'
  | 'private-30-16'
  | 'private-60-1'
  | 'private-60-4'
  | 'private-60-8'
  | 'private-60-12';

export const PRICING_PLAN_DETAILS: Record<
  PricingPlanId,
  { amount: string; description: string }
> = {
  'group-1m': {
    amount: '100.00',
    description: 'Fluentia — Group classes (1 month)',
  },
  'group-2m': {
    amount: '180.00',
    description: 'Fluentia — Group classes (2 months)',
  },
  'group-3m': {
    amount: '250.00',
    description: 'Fluentia — Group classes (3 months)',
  },
  'group-6m': {
    amount: '420.00',
    description: 'Fluentia — Group classes (6 months)',
  },
  'group-12m': {
    amount: '780.00',
    description: 'Fluentia — Group classes (12 months)',
  },
  'private-30-1': {
    amount: '15.00',
    description: 'Fluentia — Private 30 min (1 session)',
  },
  'private-30-4': {
    amount: '52.00',
    description: 'Fluentia — Private 30 min (4 sessions)',
  },
  'private-30-8': {
    amount: '96.00',
    description: 'Fluentia — Private 30 min (8 sessions)',
  },
  'private-30-12': {
    amount: '132.00',
    description: 'Fluentia — Private 30 min (12 sessions)',
  },
  'private-30-16': {
    amount: '168.00',
    description: 'Fluentia — Private 30 min (16 sessions)',
  },
  'private-60-1': {
    amount: '25.00',
    description: 'Fluentia — Private 60 min (1 session)',
  },
  'private-60-4': {
    amount: '90.00',
    description: 'Fluentia — Private 60 min (4 sessions)',
  },
  'private-60-8': {
    amount: '170.00',
    description: 'Fluentia — Private 60 min (8 sessions)',
  },
  'private-60-12': {
    amount: '240.00',
    description: 'Fluentia — Private 60 min (12 sessions)',
  },
};
