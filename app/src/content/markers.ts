import type { MarkerId } from '@lipidly/rules';

/**
 * Plain-language marker explanations (F3.2). Sample content awaiting clinical review;
 * the backend will serve the approved, versioned articles.
 */
export const MARKER_INFO: Record<MarkerId, { what: string }> = {
  triglycerides: {
    what: 'Triglycerides are a type of fat in the blood. They tend to rise with sugary food and drinks, refined starch, alcohol and inactivity.',
  },
  ldl: {
    what: 'LDL is often called “bad” cholesterol. Over time, high LDL can build up in the walls of your arteries. Fried food and saturated fat tend to raise it; fibre helps lower it.',
  },
  hdl: {
    what: 'HDL is often called “good” cholesterol because it helps carry cholesterol away from your arteries. Regular activity and not smoking help raise it.',
  },
  nonHdl: {
    what: 'Non-HDL is your total cholesterol minus HDL. It counts all the cholesterol that can build up in arteries, and is useful when triglycerides are high.',
  },
  totalCholesterol: {
    what: 'Total cholesterol is all the cholesterol in your blood, both the helpful and the less helpful kinds.',
  },
  vldl: {
    what: 'VLDL carries triglycerides in the blood. It usually moves up and down with your triglycerides.',
  },
  tcHdlRatio: {
    what: 'This ratio compares your total cholesterol with your HDL. Lower is generally better.',
  },
};

export const LEARN_ARTICLES: Record<string, { title: string; body: string[] }> = {
  'lipid-profile': {
    title: 'What a lipid profile measures',
    body: [
      'A lipid profile is a blood test that measures the fats in your blood.',
      'It usually reports total cholesterol, LDL, HDL and triglycerides. Many labs also print non-HDL cholesterol, VLDL and a total/HDL ratio.',
      'Most people with high cholesterol or triglycerides feel fine, so the test is often the only way to know how you are doing.',
    ],
  },
  prepare: {
    title: 'How to prepare for the test',
    body: [
      'Ask your doctor or lab whether you need to fast. Some labs ask for 9 to 12 hours without food; water is fine.',
      'Take your usual medicines unless your doctor tells you otherwise.',
      'Try to avoid alcohol and very heavy meals the day before, as they can raise triglycerides for a short time.',
    ],
  },
};
