export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Usamos el comando ListModels que pide el error
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.models) {
            // Extraemos solo los nombres de los modelos disponibles
            const nombres = data.models.map(m => m.name.replace('models/', '')).join(', ');
            return res.status(200).json({ resultado: "✅ MODELOS DISPONIBLES PARA TU LLAVE:\n\n" + nombres });
        } else {
            return res.status(500).json({ error: 'Respuesta inesperada: ' + JSON.stringify(data) });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Error del sistema: ' + error.message });
    }
}
