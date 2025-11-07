import React, { useState, useCallback, useMemo } from 'react';

// --- (Simplified) Data and Utility Functions ---
const Meals = { 
    protein_meals: ["Greek Yogurt", "Scrambled Eggs", "Tuna Salad", "Lentil Soup", "Grilled Chicken", "Baked Salmon", "Tofu Scramble"],
    carb_meals: ["Oatmeal", "Whole-Wheat Toast", "Brown Rice Bowl", "Sweet Potato Mash", "Whole-Grain Pasta", "Quinoa Salad", "Whole-Grain Bagel"],
    fat_meals: ["Handful of Walnuts", "1/4 Avocado", "Peanut Butter on Apple", "Cottage Cheese", "Hard-boiled Egg", "Cheese stick", "Olives"]
};

const getBmiStatus = (bmi) => {
    if (bmi < 18.5) return { text: "Underweight", color: "#FFC107" }; 
    if (bmi < 25) return { text: "Healthy Weight", color: "#4CAF50" }; 
    if (bmi < 30) return { text: "Overweight", color: "#FF9800" }; 
    return { text: "Obese", color: "#D32F2F" }; 
};

// --- Meal Plan Generator Logic (Memoized) ---
const useMealPlanGenerator = () => {
    return useCallback((proteinGoal) => {
        const days = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
        return days.map((day, i) => {
            let breakfast = Meals.protein_meals[i % Meals.protein_meals.length];
            let lunch, dinner;
            
            // Logic derived from the original HTML file
            if (i % 3 === 0) { 
                lunch = Meals.protein_meals[(i + 1) % Meals.protein_meals.length] + " & small Carb side";
                dinner = Meals.protein_meals[(i + 2) % Meals.protein_meals.length] + " & large Veggie side";
            } else if (i % 3 === 1) {
                lunch = Meals.carb_meals[(i + 3) % Meals.carb_meals.length] + " & small Protein side";
                dinner = Meals.carb_meals[(i + 4) % Meals.carb_meals.length] + " & light Fat source";
            } else {
                lunch = Meals.carb_meals[(i + 5) % Meals.carb_meals.length] + " & half portion Protein";
                dinner = Meals.protein_meals[(i + 6) % Meals.protein_meals.length] + " & half portion Carb";
            }

            let snack = Meals.fat_meals[i % Meals.fat_meals.length];

            if (proteinGoal > 120) {
                dinner = `🥩 ${dinner} (High Protein Focus)`;
            }

            return { day, breakfast, lunch, dinner, snack };
        });
    }, []);
};

// --- Results Component ---
const AnalysisResults = ({ metrics }) => {
    if (!metrics) return null;

    const { dailyCalories, proteinGrams, carbGrams, fatGrams, bmi, bmiStatus, age, proteinPercent, carbPercent, fatPercent } = metrics;
    
    // Calculate CSS for the Conic Gradient Pie Chart
    const proteinEnd = proteinPercent;
    const carbStart = proteinEnd;
    const carbEnd = carbStart + carbPercent;
    const fatStart = carbEnd;
    const fatEnd = fatStart + fatPercent;

    const pieChartStyle = {
        background: `conic-gradient(
            #f44336 0% ${proteinEnd}%,
            #2196F3 ${carbStart}% ${carbEnd}%,
            #FFC107 ${fatStart}% ${fatEnd}%
        )`,
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        transition: 'all 0.5s ease',
    };

    const warning = (age >= 4 && age < 18) 
        ? <p style={{ color: '#D32F2F', fontWeight: 700, marginTop: '15px' }}><strong>⚠️ Deficiency Focus for Growth:</strong> Ensure focused intake of **Iron, Calcium, and Vitamin D**.</p>
        : null;

    return (
        <div className="result" style={{ display: 'block', marginTop: '30px' }}>
            <h3>Your Personalized Health Metrics:</h3>
            <p style={{ fontSize: '1.1em', marginBottom: '5px' }}>Body Mass Index (BMI): <strong>{bmi}</strong></p>
            <p style={{ fontSize: '1.2em', color: bmiStatus.color, fontWeight: 700, marginBottom: '20px' }}>Health Status: {bmiStatus.text}</p>
            <hr style={{ margin: '15px 0', borderColor: '#eee' }} />
            
            <h3>Estimated Daily Nutrition Goals:</h3>
            <p>Estimated Daily Calorie Need (TDEE): <strong>{dailyCalories} kcal</strong></p>
            
            <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px', marginTop: '20px' }}>
                <div className="pie-chart" style={pieChartStyle}></div>
                
                <ul className="legend" style={{ listStyle: 'none', padding: 0, textAlign: 'left', fontSize: '0.95em' }}>
                    <li style={{ display: 'flex', alignItems: 'center' }}><span className="legend-color" style={{ backgroundColor: '#f44336', display: 'inline-block', width: '12px', height: '12px', marginRight: '8px', borderRadius: '2px' }}></span>Protein: <strong>{proteinGrams}g</strong> ({proteinPercent}%)</li>
                    <li style={{ display: 'flex', alignItems: 'center' }}><span className="legend-color" style={{ backgroundColor: '#2196F3', display: 'inline-block', width: '12px', height: '12px', marginRight: '8px', borderRadius: '2px' }}></span>Carbohydrates: <strong>{carbGrams}g</strong> ({carbPercent}%)</li>
                    <li style={{ display: 'flex', alignItems: 'center' }}><span className="legend-color" style={{ backgroundColor: '#FFC107', display: 'inline-block', width: '12px', height: '12px', marginRight: '8px', borderRadius: '2px' }}></span>Fat: <strong>{fatGrams}g</strong> ({fatPercent}%)</li>
                </ul>
            </div>
            {warning}
        </div>
    );
};

// --- Calculator Component ---
export const Calculator = ({ setMealPlan }) => {
    const [formData, setFormData] = useState({ age: '', gender: '', weight: '', height: '', activity: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState(null);
    const generateMealPlan = useMealPlanGenerator();

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        // Clear error on change
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[id];
            return newErrors;
        });
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;
        
        // Basic presence validation
        Object.keys(formData).forEach(key => {
            if (!formData[key]) {
                newErrors[key] = "This field is required.";
                isValid = false;
            }
        });
        
        // Numeric validation
        const numericFields = ['age', 'weight', 'height'];
        numericFields.forEach(key => {
            const value = parseFloat(formData[key]);
            if (value <= 0) {
                newErrors[key] = "Value must be positive.";
                isValid = false;
            }
        });
        
        setErrors(newErrors);
        return isValid;
    };

    const calculateCalories = async () => {
        if (!validateForm()) return;

        setLoading(true);
        
        // Convert input data
        const { age, gender, weight, height, activity } = formData;
        const weightFloat = parseFloat(weight);
        const heightCmFloat = parseFloat(height);
        const activityFloat = parseFloat(activity);
        const heightM = heightCmFloat / 100;

        // 1. Calculate BMR (Mifflin-St Jeor)
        let bmr;
        if (gender === 'male') {
            bmr = (10 * weightFloat) + (6.25 * heightCmFloat) - (5 * parseInt(age)) + 5;
        } else {
            bmr = (10 * weightFloat) + (6.25 * heightCmFloat) - (5 * parseInt(age)) - 161;
        }

        // 2. Calculate TDEE and Macros
        const dailyCalories = bmr * activityFloat;
        const totalCalories = Math.round(dailyCalories);

        // Macro Split: 25% P, 50% C, 25% F
        const proteinPercent = 25;
        const carbPercent = 50;
        const fatPercent = 25;
        
        const proteinGrams = Math.round((dailyCalories * (proteinPercent / 100)) / 4);
        const fatGrams = Math.round((dailyCalories * (fatPercent / 100)) / 9);
        const carbGrams = Math.round((dailyCalories * (carbPercent / 100)) / 4);
        
        // 3. Calculate BMI
        const bmi = weightFloat / (heightM * heightM);
        const roundedBmi = parseFloat(bmi.toFixed(2));
        const bmiStatus = getBmiStatus(roundedBmi);

        const newMetrics = {
            dailyCalories: totalCalories,
            proteinGrams, carbGrams, fatGrams, 
            proteinPercent, carbPercent, fatPercent,
            age: parseInt(age), bmi: roundedBmi, bmiStatus
        };
        setMetrics(newMetrics);

        // 4. Generate and set the Meal Plan (Async/Simulated API)
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        const plan = generateMealPlan(proteinGrams);
        setMealPlan(plan);
        setLoading(false);
    };

    return (
        <section id="analysis">
            <h2>1. Nutrient Analysis Hub</h2>
            <form onSubmit={(e) => { e.preventDefault(); calculateCalories(); }}>
                {/* Form Fields: Replaced original form-groups with React controlled inputs */}
                {Object.keys(formData).map(key => (
                    <div className="form-group" key={key} style={{ display: 'flex', flexDirection: 'column', margin: '15px 0' }}>
                        <label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
                        {key === 'gender' || key === 'activity' ? (
                            <select id={key} value={formData[key]} onChange={handleChange} style={{ padding: '10px', borderRadius: '5px', borderColor: errors[key] ? '#D32F2F' : '' }}>
                                <option value="">Select</option>
                                {key === 'gender' && (
                                    <>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </>
                                )}
                                {key === 'activity' && (
                                    <>
                                        <option value="1.2">Sedentary</option>
                                        <option value="1.375">Lightly active</option>
                                        <option value="1.55">Moderately active</option>
                                        <option value="1.725">Very active</option>
                                        <option value="1.9">Super active</option>
                                    </>
                                )}
                            </select>
                        ) : (
                            <input 
                                type="number" 
                                id={key} 
                                value={formData[key]} 
                                onChange={handleChange} 
                                min="1" 
                                step={key === 'weight' ? '0.1' : '1'} 
                                style={{ padding: '10px', borderRadius: '5px', borderColor: errors[key] ? '#D32F2F' : '' }}
                            />
                        )}
                        {errors[key] && <span className="error-message" style={{ color: '#D32F2F', fontSize: '0.8em', marginTop: '5px' }}>{errors[key]}</span>}
                    </div>
                ))}

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: loading ? '#ccc' : '#f4a261', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    {loading ? 'Calculating...' : 'Generate Personalized Plan'}
                </button>
            </form>
            <AnalysisResults metrics={metrics} />
        </section>
    );
};

// --- Meal Plan Table Component ---
export const MealPlanTable = ({ mealPlan, isLoading }) => {
    if (isLoading) {
        return <div className="loading-text" style={{ textAlign: 'center', fontSize: '1.2em', color: '#03a9f4', margin: '20px 0' }}>🔄 Loading Personalized Plan...</div>;
    }

    if (!mealPlan || mealPlan.length === 0) {
        return <div style={{ textAlign: 'center', color: '#777', padding: '20px' }}>**Please use the Nutrient Analysis Hub (Section 1) above to generate your plan.**</div>;
    }

    return (
        <table className="meal-plan-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
                <tr>
                    <th>Day</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Snack</th>
                </tr>
            </thead>
            <tbody>
                {mealPlan.map((item, index) => (
                    <tr key={index}>
                        <td>{item.day}</td>
                        <td>{item.breakfast}</td>
                        <td>{item.lunch}</td>
                        <td>{item.dinner}</td>
                        <td>{item.snack}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
