document.getElementById('searchForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Förhindra att formuläret skickas och sidan laddas om

    const queryType = document.getElementById('queryType').value;
    const searchParam = document.getElementById('input').value.trim();

    if (!searchParam) {
        alert('Var god och ange ett sökparametrar (genre, skådespelare, etc.).');
        return;
    }

    try {
        // Skapa URL för att skicka begäran till servern
        const response = await fetch(`/fetch-movies?queryType=${encodeURIComponent(queryType)}&searchParam=${encodeURIComponent(searchParam)}`, {
            method: 'GET', // Använd GET-begäran
        });

        if (!response.ok) {
            throw new Error('Något gick fel med begäran');
        }

        // Hämta och visa resultaten
        const data = await response.json();
        const resultDiv = document.getElementById('result');
        
        if (data.length === 0) {
            resultDiv.innerHTML = `<p>Inga resultat hittades för: ${searchParam}</p>`;
        } else {
            let resultHTML = "<ul>";
            data.forEach(item => {
                resultHTML += "<li>";
                
                // Loopar genom alla nycklar i objektet (dynamiskt)
                for (let key in item) {
                    if (item.hasOwnProperty(key)) {
                        resultHTML += `<span><strong>${key}:</strong> ${item[key]}</span> `;
                    }
                }

                resultHTML += "</li>";
            });
            resultHTML += "</ul>";
            resultDiv.innerHTML = resultHTML;
        }
    } catch (error) {
        console.error('Fel vid hämtning av filmer:', error);
        alert('Ett fel inträffade. Försök igen senare.');
    }
});
