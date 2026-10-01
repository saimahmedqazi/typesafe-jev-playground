export interface StatePreset {
  id: string;
  name: string;
  description: string;
  questionId: string;
  state: Record<string, unknown>;
  questions?: Record<string, any>;
}

export const STATE_PRESETS: StatePreset[] = [
  // Official TypeSafe AI Jev Playground Presets
  {
    id: 'is-sandwich-official',
    name: 'Official Jev is_sandwich (Burger)',
    description: 'Exact setup from TypeSafe AI official playground: Evaluating if a Burger is a sandwich.',
    questionId: 'is_sandwich',
    state: {
      food: 'Burger',
      definition: 'A burger is a cooked patty served between the two halves of a sliced bread bun, often with toppings such as lettuce, tomato, cheese, and condiments.',
    },
    questions: {
      is_sandwich: {
        type: 'noul',
        instructions: 'Is `food` a sandwich?',
        criteria: {
          true: 'A sandwich is a kebab closed in bun',
          false: 'The food has no bread enclosing a filling or uses only a single slice of bread, or uses a non-bread wrapper such as a tortilla, wafer, or cookie.',
        },
      },
    },
  },
  {
    id: 'customer-support-multi',
    name: 'Customer Support (Choice + Score + Noul)',
    description: 'Evaluates customer ticket across Choice (routing), Score (frustration), and Noul (urgent escalation).',
    questionId: 'customer_support',
    state: {
      ticket_id: 'TCK-8921',
      customer: 'Apex Logistics',
      message: 'The order arrived yesterday but it was broken. I want my money back immediately. This is our third delayed delivery this month.',
    },
    questions: {
      department: {
        type: 'choice',
        instructions: 'Which team should handle this ticket?',
        criteria: {
          billing: 'Payments, refunds, disputes, invoicing',
          technical: 'Software bugs, system outages, API issues',
          shipping: 'Damaged packages, logistics, carrier tracking',
        },
      },
      frustration: {
        type: 'score',
        instructions: 'How frustrated is the customer?',
        criteria: ['Calm', 'Frustrated', 'Very angry'],
      },
      is_urgent: {
        type: 'noul',
        instructions: 'Does this require prompt attention?',
      },
    },
  },
  {
    id: 'food-classifier-multi',
    name: 'Culinary Classifier (Choice + Score)',
    description: 'Categorizes culinary item and scores freshness/compositional balance.',
    questionId: 'classify_food',
    state: {
      item: 'Chicken Caesar Wrap',
      enclosure: 'flour tortilla roll',
      filling: 'grilled chicken, crisp romaine, parmesan',
      dressing: 'creamy caesar dressing',
      temperature: 'chilled',
      handheld: true,
    },
    questions: {
      category: {
        type: 'choice',
        instructions: 'Categorize which culinary category this food item belongs to.',
        criteria: {
          sandwich: 'Bread or carb enclosure enclosing filling, handheld',
          salad: 'Greens and vegetables tossed with dressing',
          soup: 'Liquid or broth dish served in bowl',
          pastry: 'Baked dough or confection',
          entree: 'Main plated dish requiring cutlery',
        },
      },
      quality_score: {
        type: 'score',
        instructions: 'Score the overall culinary execution and compositional freshness.',
        criteria: ['Poor', 'Fair', 'Good', 'Artisanal / Pristine'],
      },
    },
  },

  // Presets for is_sandwich (Noul)
  {
    id: 'classic-blt',
    name: 'Classic BLT Sandwich',
    description: 'Crisp bacon, lettuce, and sliced tomato layered between two slices of toasted sourdough.',
    questionId: 'is_sandwich',
    state: {
      object: 'BLT Sandwich',
      bread: true,
      bread_type: 'toasted sourdough',
      slices: 2,
      filling: 'crisp bacon, fresh romaine lettuce, and sliced tomato',
      sauce: 'mayonnaise',
      form_factor: 'closed two-slice sandwich',
      portable: true,
    },
  },
  {
    id: 'open-faced-tartine',
    name: 'Avocado Tartine (Open-Faced)',
    description: 'A single slice of rustic bread topped with mashed avocado and sea salt.',
    questionId: 'is_sandwich',
    state: {
      object: 'Avocado Tartine',
      bread: true,
      bread_type: 'rustic levain loaf',
      slices: 1,
      filling: 'smashed avocado, radishes, flaky sea salt',
      form_factor: 'open-faced',
      portable: false,
    },
  },
  {
    id: 'hot-dog',
    name: 'Hot Dog in Bun',
    description: 'A beef frankfurter nestled inside a single split-top bun (classic culinary debate).',
    questionId: 'is_sandwich',
    state: {
      object: 'Hot Dog',
      bread: true,
      bread_type: 'split-top hot dog bun',
      slices: 1,
      split_bun: true,
      filling: 'all-beef frankfurter',
      condiments: 'dijon mustard and diced pickles',
      portable: true,
    },
  },
  {
    id: 'burrito',
    name: 'Mission-Style Burrito',
    description: 'Rice, beans, and carnitas completely wrapped in a large flour tortilla.',
    questionId: 'is_sandwich',
    state: {
      object: 'Burrito',
      wrapper: 'large flour tortilla',
      bread: false,
      sliced: false,
      filling: 'carnitas, black beans, seasoned rice, pico de gallo',
      form_factor: 'cylindrical roll wrap',
      portable: true,
    },
  },
  {
    id: 'bowl-of-soup',
    name: 'Bowl of Tomato Bisque',
    description: 'Liquid soup served in a bowl with cracker garnish — non-sandwich counterexample.',
    questionId: 'is_sandwich',
    state: {
      object: 'Tomato Bisque',
      liquid: true,
      bread: false,
      container: 'ceramic bowl',
      cutlery_needed: 'spoon',
      filling: 'pureed roasted tomatoes and cream',
      portable: false,
    },
  },

  // Presets for new_score_1 (Score)
  {
    id: 'pristine-state',
    name: 'Pristine Item State',
    description: 'Exemplary execution with top-tier freshness, optimal temperature, and balanced presentation.',
    questionId: 'new_score_1',
    state: {
      item: 'Freshly Baked Panini',
      freshness: 0.98,
      ingredient_tier: 'artisanal organic',
      temperature_celsius: 65,
      texture: 'crusty exterior with melted interior',
      aesthetic_score: 0.95,
      balance_ratio: 0.92,
    },
  },
  {
    id: 'average-state',
    name: 'Average Baseline State',
    description: 'Standard packaged meal item with acceptable but unremarkable characteristics.',
    questionId: 'new_score_1',
    state: {
      item: 'Commercial Pre-Packaged Wrap',
      freshness: 0.62,
      ingredient_tier: 'standard commercial',
      temperature_celsius: 8,
      texture: 'slightly soft exterior',
      aesthetic_score: 0.58,
      balance_ratio: 0.6,
    },
  },
  {
    id: 'degraded-state',
    name: 'Degraded / Deficient State',
    description: 'Stale item left at room temperature with separated sauces and poor structural integrity.',
    questionId: 'new_score_1',
    state: {
      item: 'Day-Old Counter Leftover',
      freshness: 0.12,
      ingredient_tier: 'budget',
      temperature_celsius: 23,
      texture: 'soggy bottom with dried top',
      aesthetic_score: 0.15,
      balance_ratio: 0.2,
    },
  },

  // Presets for classify_food (Choice)
  {
    id: 'caesar-wrap-state',
    name: 'Grilled Chicken Wrap',
    description: 'Tortilla rolled tightly around grilled chicken, parmesan, and crisp greens.',
    questionId: 'classify_food',
    state: {
      item: 'Grilled Chicken Wrap',
      enclosure: 'flour tortilla roll',
      filling: 'grilled chicken, crisp romaine, parmesan',
      dressing: 'caesar dressing',
      temperature: 'chilled',
      handheld: true,
    },
  },
  {
    id: 'minestrone-soup-state',
    name: 'Hearty Minestrone',
    description: 'Vegetables and ditalini pasta simmered in rich tomato broth.',
    questionId: 'classify_food',
    state: {
      item: 'Classic Minestrone',
      consistency: 'broth and simmered vegetables',
      container: 'porcelain bowl',
      ingredients: ['cannellini beans', 'carrots', 'celery', 'ditalini pasta', 'vegetable broth'],
      temperature: 'steaming hot',
      utensil: 'soup spoon',
      handheld: false,
    },
  },
  {
    id: 'butter-croissant-state',
    name: 'French Butter Croissant',
    description: 'Laminated flaky pastry dough baked to golden perfection.',
    questionId: 'classify_food',
    state: {
      item: 'Artisanal Croissant',
      dough: 'laminated yeast dough with layered butter',
      baking_method: 'convection oven baked',
      texture: 'crisp flaky crust with airy honeycomb interior',
      flavor: 'buttery and subtly sweet',
      handheld: true,
    },
  },
  {
    id: 'greek-salad-state',
    name: 'Kalamata Greek Salad',
    description: 'Cucumbers, tomatoes, kalamata olives, and feta cheese tossed with olive oil.',
    questionId: 'classify_food',
    state: {
      item: 'Mediterranean Greek Salad',
      base: 'chopped cucumbers, vine tomatoes, red onion',
      cheese: 'block of aged feta cheese',
      dressing: 'extra virgin olive oil and oregano',
      liquid_volume_ml: 20,
      utensil: 'salad fork',
      handheld: false,
    },
  },
];

export function getPresetsForQuestion(questionId: string): StatePreset[] {
  return STATE_PRESETS.filter((p) => p.questionId === questionId);
}

export function getPresetById(presetId: string): StatePreset | undefined {
  return STATE_PRESETS.find((p) => p.id === presetId);
}
