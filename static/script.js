async function getPrediction() {
  const symptoms = document.getElementById('symptomsInput').value.trim();

  if (!symptoms) {
    alert("Please enter some symptoms first!");
    return;
  }

  try {
    const response = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms })
    });

    const data = await response.json();

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <strong>Disease:</strong> ${data.disease}<br>
      <strong>Cure:</strong> ${data.cure}
    `;
  } catch (err) {
    alert("Something went wrong! 😢");
    console.error(err);
  }
}

document.getElementById('submitBtn').addEventListener('click', getPrediction);
