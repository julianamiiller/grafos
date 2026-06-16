# Algoritmo de Dijkstra - Demonstração Interativa

Projeto desenvolvido para a disciplina de Estrutura de Dados. Consiste em uma aplicação web construída com Django que demonstra visualmente o funcionamento do **Algoritmo de Dijkstra** para encontrar o caminho mais curto em um grafo ponderado. 

O cenário utilizado como exemplo é uma rede de bairros da cidade de Maricá, RJ.

## 🚀 Funcionalidades

- **Visualização Interativa:** Grafo renderizado inteiramente em HTML5 Canvas, sem dependências de bibliotecas externas complexas.
- **Execução Passo a Passo:** Tabela dinâmica que mostra a atualização das distâncias e a exploração de cada vértice em tempo real.
- **Cálculo de Rota:** Seleção de origem e destino para calcular a distância total, número de vértices percorridos e destacar o caminho mínimo na tela.

## 🛠️ Tecnologias Utilizadas

- **Back-end:** Python, Django
- **Front-end:** HTML5, CSS3, Vanilla JavaScript (Canvas API)

## ⚙️ Como Executar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/julianamiiller/grafos.git
   cd grafos
   ```

2. **Crie um ambiente virtual (opcional, mas recomendado):**
   ```bash
   python -m venv venv
   # No Windows:
   venv\Scripts\activate
   # No Linux/Mac:
   source venv/bin/activate
   ```

3. **Instale o Django:**
   ```bash
   pip install django
   ```

4. **Execute as migrações (se houver modelos novos):**
   ```bash
   python manage.py migrate
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   python manage.py runserver
   ```

6. **Acesse a aplicação:**
   Abra o navegador e acesse [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

## 👥 Equipe de Desenvolvimento

- Juliana Miiller
- Breno Quadros
- Bernardo Rocha
- Sandy Mendes
- Igor Borges
- Richard Fernandes

---
*Trabalho acadêmico apresentado para a disciplina de Estrutura de Dados.*
