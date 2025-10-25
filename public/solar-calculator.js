document.getElementById('calculate-button').addEventListener('click', function() {
    const panelCapacity = parseFloat(document.getElementById('panel-capacity').value); // in kW
    const roofArea = parseFloat(document.getElementById('roof-area').value); // in sq ft
    const budget = parseFloat(document.getElementById('budget').value); // in Rs
    const electricityCost = parseFloat(document.getElementById('electricity-cost').value); // Rs/kWh
    
    // Calculation logic
    const averageSunHours = 5; // Assumed average daily peak sun hours
    const annualEnergyProduction = panelCapacity * averageSunHours * 365; // in kWh

    // Estimate annual savings based on electricity cost
    const annualSavings = annualEnergyProduction * electricityCost;

    // Display the results
    document.getElementById('calculated-savings').value = annualSavings;
    document.getElementById('results-container').innerHTML = `
        <h5>Calculation Results:</h5>
        <p>Estimated Annual Savings: Rs. ${annualSavings.toFixed(2)}</p>
        <p>Estimated Energy Production: ${annualEnergyProduction.toFixed(2)} kWh</p>
    `;
});
