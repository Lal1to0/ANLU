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
        
        // 🔴 SISTEMA DE CASCADA: Lista de modelos desde el más avanzado al más clásico
        const modelos = [
            'gemini-3.5-flash',
            'gemini-2.5-flash',
            'gemini-1.5-flash'
        ];
        
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

        let data = null;
        let modeloExitoso = '';

        // El código intentará conectarse a cada modelo en orden
        for (const modelo of modelos) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (response.ok) {
                data = await response.json();
                modeloExitoso = modelo;
                break; // Si el modelo responde bien, detenemos la búsqueda
            }
        }

        // Si después de probar todos la variable "data" sigue vacía, significa que Google entero colapsó
        if (!data) {
            return res.status(500).json({ error: 'Todos los servidores de Google IA están saturados. Intenta en un par de minutos.' });
        }

        let resultadoTexto = data.candidates[0].content.parts[0].text.trim();
        resultadoTexto = resultadoTexto.replace(/```json/g, "").replace(/```/g, "").trim();
        const perfumeData = JSON.parse(resultadoTexto);

        const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
        if (!sheetsUrl) {
            return res.status(500).json({ error: 'Falta la URL de Sheets en Vercel' });
        }

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
                // Modificamos el mensaje para que te diga qué modelo logró hacer el trabajo
                res.status(200).json({ resultado: `✅ ¡ÉXITO! Datos inyectados en tu Google Sheets. (Se usó el modelo: ${modeloExitoso})` });
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
