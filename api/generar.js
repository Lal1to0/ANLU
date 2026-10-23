export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { password, perfume } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Contraseña incorrecta. Acceso denegado.' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `Eres un experto en perfumería. Analiza el perfume "${perfume}".
        Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin markdown, sin texto adicional):
        {
          "nombre": "Nombre del perfume",
          "marca": "Marca",
          "genero": "Femenino / Masculino / Unisex",
          "concentracion": "EDT / EDP / Parfum / etc",
          "acordes": ["Acorde 1", "Acorde 2", "Acorde 3", "Acorde 4", "Acorde 5"],
          "salida": "Notas de salida",
          "corazon": "Notas de corazón",
          "fondo": "Notas de fondo"
        }`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(500).json({ error: 'Error de la IA: ' + (data.error?.message || 'Desconocido') });
        }

        let resultadoTexto = data.candidates[0].content.parts[0].text.trim();
        resultadoTexto = resultadoTexto.replace(/```json/g, "").replace(/```/g, "").trim();
        const perfumeData = JSON.parse(resultadoTexto);

        const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
        if (!sheetsUrl) {
            return res.status(500).json({ error: 'Falta la URL de Sheets en Vercel' });
        }

        // 🔴 CORRECCIÓN: Agregamos las cabeceras para que Google acepte los datos
        const sheetsResponse = await fetch(sheetsUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(perfumeData)
        });

        const rawText = await sheetsResponse.text();
        
        try {
            const sheetsResult = JSON.parse(rawText);
            if (sheetsResult.estado === "exito") {
                res.status(200).json({ resultado: `✅ ¡ÉXITO! Los datos de ${perfumeData.nombre} se inyectaron automáticamente en tu Google Sheets.` });
            } else {
                throw new Error("Google Sheets rechazó la conexión.");
            }
        } catch (e) {
            return res.status(500).json({ error: 'Asegúrate de que la pestaña de tu Excel se llame exactamente "Inventario".' });
        }

    } catch (error) {
        res.status(500).json({ error: 'Error del sistema: ' + error.message });
    }
}
