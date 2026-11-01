from crewai import Agent, Crew, Process, Task, LLM
import os

# Clave ficticia necesaria para evitar que CrewAI/LiteLLM busque una clave real de OpenAI
os.environ["OPENAI_API_KEY"] = "dummy-key"

# Configurar el modelo local de Ollama
local_llm = LLM(
    model="ollama/llama3",
    base_url="http://localhost:11434"
)

# 1. Definir el Agente de Marketing usando el LLM local
market_agent = Agent(
    role='Especialista de Marketing para ANLU Parfums',
    goal='Crear ganchos y copys virales para Instagram y TikTok enfocados en perfumería',
    backstory='Eres un experto en marketing digital especializado en marcas de fragancias de lujo y árabes en Venezuela. Conoces los dolores del cliente y sabes cómo generar deseo inmediato.',
    verbose=True,
    llm=local_llm
)

# 2. Definir el Agente de Inventario y Logística usando el LLM local
inventory_agent = Agent(
    role='Gestor de Inventario y Cadena de Suministro',
    goal='Analizar la rotación de fragancias y proponer estrategias de reposición',
    backstory='Controlas minuciosamente el stock, calculas márgenes y sabes qué fragancias tienen mayor demanda en el mercado local.',
    verbose=True,
    llm=local_llm
)

# 3. Definir las Tareas para los agentes
task_marketing = Task(
    description='Redactar un guion corto para un Reel de Instagram sobre un perfume árabe con notas avainilladas y amaderadas, ideal para el clima de Venezuela.',
    expected_output='Un guion estructurado con Gancho (0-3s), Desarrollo (3-15s) y Llamado a la Acción hacia la web de ANLU Parfums.',
    agent=market_agent
)

task_inventory = Task(
    description='Evaluar qué tipo de fragancias (diseñador vs. árabes) conviene priorizar en la próxima importación mediante APG Logistics basándose en la alta rotación.',
    expected_output='Un reporte ejecutivo con 3 recomendaciones clave de abastecimiento.',
    agent=inventory_agent
)

# 4. Ensamblar la tripulación (Crew) y ponerla a trabajar
anlu_office = Crew(
    agents=[market_agent, inventory_agent],
    tasks=[task_marketing, task_inventory],
    process=Process.sequential,
    verbose=True
)

if __name__ == "__main__":
    print("## 🤖 INICIANDO OFICINA VIRTUAL LOCAL DE ANLU PARFUMS ##")
    result = anlu_office.kickoff()
    print("\n\n########################")
    print("## RESULTADO FINAL DE LA OFICINA ##")
    print("########################\n")
    print(result)