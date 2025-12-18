const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const MealPlan = require('../models/MealPlan');

// Get all recipes
router.get('/recipes', auth, async (req, res) => {
  try {
    const recipes = await Recipe.find({
      $or: [
        { createdBy: req.user.id },
        { isPublic: true }
      ]
    });
    res.json(recipes);
  } catch (error) {
    console.error('Recipe fetch error:', error);
    res.status(500).json({ message: 'Error fetching recipes' });
  }
});

// Create new recipe
router.post('/recipes', auth, async (req, res) => {
  try {
    const recipe = await Recipe.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Recipe creation error:', error);
    res.status(500).json({ message: 'Error creating recipe' });
  }
});

// Get meal plan for a specific date range
router.get('/meal-plan', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const mealPlans = await MealPlan.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('meals.recipeId');
    res.json(mealPlans);
  } catch (error) {
    console.error('Meal plan fetch error:', error);
    res.status(500).json({ message: 'Error fetching meal plans' });
  }
});

// Create or update meal plan
router.post('/meal-plan', auth, async (req, res) => {
  try {
    const { date, meals } = req.body;
    const mealPlan = await MealPlan.findOneAndUpdate(
      { userId: req.user.id, date },
      { userId: req.user.id, date, meals },
      { upsert: true, new: true }
    ).populate('meals.recipeId');
    
    // Generate grocery list
    const groceryList = await generateGroceryList(meals);
    mealPlan.groceryList = groceryList;
    await mealPlan.save();

    res.json(mealPlan);
  } catch (error) {
    console.error('Meal plan update error:', error);
    res.status(500).json({ message: 'Error updating meal plan' });
  }
});

// Get grocery list
router.get('/grocery-list', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const mealPlans = await MealPlan.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    const combinedGroceryList = mealPlans.reduce((acc, plan) => {
      plan.groceryList.forEach(item => {
        const existingItem = acc.find(i => i.item === item.item && i.unit === item.unit);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          acc.push({ ...item.toObject() });
        }
      });
      return acc;
    }, []);

    res.json(combinedGroceryList);
  } catch (error) {
    console.error('Grocery list error:', error);
    res.status(500).json({ message: 'Error generating grocery list' });
  }
});

// Update grocery list item status
router.patch('/grocery-list/:mealPlanId/:itemId', auth, async (req, res) => {
  try {
    const { mealPlanId, itemId } = req.params;
    const { checked } = req.body;

    const mealPlan = await MealPlan.findById(mealPlanId);
    const groceryItem = mealPlan.groceryList.id(itemId);
    groceryItem.checked = checked;
    await mealPlan.save();

    res.json(groceryItem);
  } catch (error) {
    console.error('Grocery item update error:', error);
    res.status(500).json({ message: 'Error updating grocery item' });
  }
});

// Get meal suggestions based on BMI and goals
router.post('/meal-suggestions', auth, async (req, res) => {
  try {
    const { calorieGoal, proteinGoal, bmi, fitnessGoal, activityLevel } = req.body;
    
    if (!calorieGoal || !proteinGoal) {
      return res.status(400).json({ message: 'Calorie and protein goals are required' });
    }

    // Calculate meal distribution based on goals
    const mealDistribution = calculateMealDistribution(calorieGoal, proteinGoal, bmi, fitnessGoal, activityLevel);
    
    // Get suggested meals for each meal type
    const suggestions = await generateMealSuggestions(mealDistribution);
    
    res.json(suggestions);
  } catch (error) {
    console.error('Meal suggestions error:', error);
    res.status(500).json({ message: 'Error generating meal suggestions' });
  }
});

// Calculate meal distribution based on goals and BMI
function calculateMealDistribution(calorieGoal, proteinGoal, bmi, fitnessGoal, activityLevel) {
  // Base distribution percentages
  let breakfastCalories, lunchCalories, dinnerCalories, snackCalories;
  let breakfastProtein, lunchProtein, dinnerProtein, snackProtein;

  // Adjust distribution based on BMI and fitness goals
  if (bmi < 18.5) {
    // Underweight - more calories in main meals
    breakfastCalories = calorieGoal * 0.30; // 30%
    lunchCalories = calorieGoal * 0.35;     // 35%
    dinnerCalories = calorieGoal * 0.25;    // 25%
    snackCalories = calorieGoal * 0.10;     // 10%
  } else if (bmi >= 18.5 && bmi < 25) {
    // Normal weight - balanced distribution
    breakfastCalories = calorieGoal * 0.25; // 25%
    lunchCalories = calorieGoal * 0.35;     // 35%
    dinnerCalories = calorieGoal * 0.30;    // 30%
    snackCalories = calorieGoal * 0.10;     // 10%
  } else if (bmi >= 25 && bmi < 30) {
    // Overweight - more calories earlier in the day
    breakfastCalories = calorieGoal * 0.30; // 30%
    lunchCalories = calorieGoal * 0.35;     // 35%
    dinnerCalories = calorieGoal * 0.25;    // 25%
    snackCalories = calorieGoal * 0.10;     // 10%
  } else {
    // Obese - focus on portion control
    breakfastCalories = calorieGoal * 0.25; // 25%
    lunchCalories = calorieGoal * 0.30;     // 30%
    dinnerCalories = calorieGoal * 0.30;    // 30%
    snackCalories = calorieGoal * 0.15;     // 15%
  }

  // Adjust for fitness goals
  if (fitnessGoal === 'lose') {
    // Slightly reduce dinner calories for weight loss
    dinnerCalories *= 0.9;
    snackCalories += (calorieGoal * 0.1 - snackCalories);
  } else if (fitnessGoal === 'gain') {
    // Increase all meals slightly for weight gain
    breakfastCalories *= 1.1;
    lunchCalories *= 1.1;
    dinnerCalories *= 1.1;
  }

  // Protein distribution (more protein in main meals)
  breakfastProtein = proteinGoal * 0.25; // 25%
  lunchProtein = proteinGoal * 0.35;     // 35%
  dinnerProtein = proteinGoal * 0.30;    // 30%
  snackProtein = proteinGoal * 0.10;     // 10%

  return {
    breakfast: {
      calories: Math.round(breakfastCalories),
      protein: Math.round(breakfastProtein),
      carbs: Math.round((breakfastCalories * 0.45) / 4), // 45% of calories from carbs
      fats: Math.round((breakfastCalories * 0.25) / 9)   // 25% of calories from fats
    },
    lunch: {
      calories: Math.round(lunchCalories),
      protein: Math.round(lunchProtein),
      carbs: Math.round((lunchCalories * 0.45) / 4),
      fats: Math.round((lunchCalories * 0.25) / 9)
    },
    dinner: {
      calories: Math.round(dinnerCalories),
      protein: Math.round(dinnerProtein),
      carbs: Math.round((dinnerCalories * 0.45) / 4),
      fats: Math.round((dinnerCalories * 0.25) / 9)
    },
    snack: {
      calories: Math.round(snackCalories),
      protein: Math.round(snackProtein),
      carbs: Math.round((snackCalories * 0.45) / 4),
      fats: Math.round((snackCalories * 0.25) / 9)
    }
  };
}

// Generate meal suggestions based on distribution
async function generateMealSuggestions(mealDistribution) {
  const suggestions = {};

  for (const [mealType, goals] of Object.entries(mealDistribution)) {
    suggestions[mealType] = await getMealSuggestionsForType(mealType, goals);
  }

  return suggestions;
}

// Get specific meal suggestions for a meal type
async function getMealSuggestionsForType(mealType, goals) {
  const suggestions = [];
  
  // Define meal suggestions based on meal type and goals
  const mealDatabase = {
    breakfast: [
      {
        name: "Protein Oatmeal Bowl",
        description: "Oatmeal with Greek yogurt, berries, and nuts",
        calories: 350,
        protein: 25,
        carbs: 45,
        fats: 12,
        prepTime: 10,
        ingredients: ["1/2 cup oats", "1/2 cup Greek yogurt", "1/2 cup berries", "1 tbsp nuts", "1 tbsp honey"],
        instructions: ["Cook oats with water", "Mix in Greek yogurt", "Top with berries and nuts", "Drizzle with honey"]
      },
      {
        name: "Avocado Toast with Eggs",
        description: "Whole grain toast with avocado and poached eggs",
        calories: 320,
        protein: 22,
        carbs: 35,
        fats: 15,
        prepTime: 15,
        ingredients: ["2 slices whole grain bread", "1 avocado", "2 eggs", "Salt and pepper", "Red pepper flakes"],
        instructions: ["Toast bread", "Mash avocado with salt and pepper", "Poach eggs", "Assemble toast with avocado and eggs"]
      },
      {
        name: "Greek Yogurt Parfait",
        description: "Greek yogurt with granola and fresh fruit",
        calories: 280,
        protein: 20,
        carbs: 30,
        fats: 8,
        prepTime: 5,
        ingredients: ["1 cup Greek yogurt", "1/4 cup granola", "1/2 cup mixed berries", "1 tbsp chia seeds"],
        instructions: ["Layer yogurt in glass", "Add granola and berries", "Top with chia seeds"]
      }
    ],
    lunch: [
      {
        name: "Grilled Chicken Salad",
        description: "Mixed greens with grilled chicken, vegetables, and vinaigrette",
        calories: 400,
        protein: 35,
        carbs: 20,
        fats: 18,
        prepTime: 20,
        ingredients: ["4 oz chicken breast", "2 cups mixed greens", "1/2 cucumber", "1 tomato", "2 tbsp olive oil", "1 tbsp vinegar"],
        instructions: ["Grill chicken breast", "Chop vegetables", "Mix salad ingredients", "Dress with olive oil and vinegar"]
      },
      {
        name: "Quinoa Buddha Bowl",
        description: "Quinoa bowl with roasted vegetables and tahini dressing",
        calories: 380,
        protein: 18,
        carbs: 55,
        fats: 12,
        prepTime: 25,
        ingredients: ["1/2 cup quinoa", "1 cup roasted vegetables", "1/4 cup chickpeas", "2 tbsp tahini", "1 tbsp lemon juice"],
        instructions: ["Cook quinoa", "Roast vegetables", "Mix all ingredients", "Dress with tahini and lemon"]
      },
      {
        name: "Turkey Wrap",
        description: "Whole wheat wrap with turkey, vegetables, and hummus",
        calories: 350,
        protein: 28,
        carbs: 40,
        fats: 10,
        prepTime: 10,
        ingredients: ["1 whole wheat tortilla", "3 oz turkey breast", "1/4 avocado", "1/4 cup vegetables", "2 tbsp hummus"],
        instructions: ["Spread hummus on tortilla", "Add turkey and vegetables", "Roll tightly", "Cut in half"]
      }
    ],
    dinner: [
      {
        name: "Baked Salmon with Sweet Potato",
        description: "Herb-crusted salmon with roasted sweet potato and broccoli",
        calories: 450,
        protein: 40,
        carbs: 35,
        fats: 20,
        prepTime: 30,
        ingredients: ["6 oz salmon fillet", "1 medium sweet potato", "1 cup broccoli", "2 tbsp olive oil", "Herbs and spices"],
        instructions: ["Season salmon with herbs", "Bake salmon and sweet potato", "Steam broccoli", "Serve together"]
      },
      {
        name: "Lean Beef Stir Fry",
        description: "Stir-fried lean beef with vegetables and brown rice",
        calories: 420,
        protein: 35,
        carbs: 45,
        fats: 12,
        prepTime: 25,
        ingredients: ["4 oz lean beef", "1 cup mixed vegetables", "1/2 cup brown rice", "2 tbsp soy sauce", "1 tbsp sesame oil"],
        instructions: ["Cook brown rice", "Stir-fry beef and vegetables", "Add sauce", "Serve over rice"]
      },
      {
        name: "Vegetarian Chili",
        description: "Bean and vegetable chili with quinoa",
        calories: 380,
        protein: 22,
        carbs: 60,
        fats: 8,
        prepTime: 35,
        ingredients: ["1 cup mixed beans", "1 cup vegetables", "1/2 cup quinoa", "1 can tomatoes", "Chili spices"],
        instructions: ["Sauté vegetables", "Add beans and tomatoes", "Simmer with spices", "Serve over quinoa"]
      }
    ],
    snack: [
      {
        name: "Apple with Almond Butter",
        description: "Sliced apple with natural almond butter",
        calories: 200,
        protein: 8,
        carbs: 25,
        fats: 12,
        prepTime: 5,
        ingredients: ["1 medium apple", "2 tbsp almond butter"],
        instructions: ["Slice apple", "Serve with almond butter"]
      },
      {
        name: "Greek Yogurt with Berries",
        description: "Plain Greek yogurt with fresh berries",
        calories: 150,
        protein: 15,
        carbs: 20,
        fats: 2,
        prepTime: 3,
        ingredients: ["1/2 cup Greek yogurt", "1/2 cup berries"],
        instructions: ["Mix yogurt and berries", "Serve immediately"]
      },
      {
        name: "Mixed Nuts",
        description: "Handful of mixed nuts and dried fruit",
        calories: 180,
        protein: 6,
        carbs: 15,
        fats: 14,
        prepTime: 2,
        ingredients: ["1/4 cup mixed nuts", "1 tbsp dried fruit"],
        instructions: ["Mix nuts and dried fruit", "Portion into small container"]
      }
    ]
  };

  // Filter suggestions based on calorie and protein goals
  const mealOptions = mealDatabase[mealType] || [];
  const tolerance = 0.2; // 20% tolerance for calories and protein

  const filteredMeals = mealOptions.filter(meal => {
    const calorieMatch = Math.abs(meal.calories - goals.calories) <= goals.calories * tolerance;
    const proteinMatch = Math.abs(meal.protein - goals.protein) <= goals.protein * tolerance;
    return calorieMatch && proteinMatch;
  });

  // If no exact matches, get closest matches
  if (filteredMeals.length === 0) {
    const sortedMeals = mealOptions.sort((a, b) => {
      const aCalorieDiff = Math.abs(a.calories - goals.calories);
      const bCalorieDiff = Math.abs(b.calories - goals.calories);
      return aCalorieDiff - bCalorieDiff;
    });
    
    return sortedMeals.slice(0, 3); // Return top 3 closest matches
  }

  return filteredMeals.slice(0, 3); // Return top 3 matches
}

async function generateGroceryList(meals) {
  const groceryList = [];
  const recipeIds = meals.map(meal => meal.recipeId);
  const recipes = await Recipe.find({ _id: { $in: recipeIds } });

  recipes.forEach(recipe => {
    const meal = meals.find(m => m.recipeId.toString() === recipe._id.toString());
    const servingMultiplier = meal.servings || 1;

    recipe.ingredients.forEach(ingredient => {
      const existingItem = groceryList.find(
        item => item.item === ingredient.name && item.unit === ingredient.unit
      );

      if (existingItem) {
        existingItem.quantity += ingredient.amount * servingMultiplier;
      } else {
        groceryList.push({
          item: ingredient.name,
          quantity: ingredient.amount * servingMultiplier,
          unit: ingredient.unit,
          checked: false
        });
      }
    });
  });

  return groceryList;
}

module.exports = router;