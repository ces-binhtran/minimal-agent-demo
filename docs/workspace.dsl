workspace "Knowledge Ownership Agent" "C4 Model for an AI-powered codebase ownership analysis agent" {

    !adrs "adrs"
    !docs "docs"

    model {
        engineer = person "Software Engineer" "Asks questions about code ownership, bus factors, and risk."
        techlead = person "Tech Lead" "Reviews ownership distribution and planning."
        
        group "Knowledge Ownership System" {
            
            agentSystem = softwareSystem "Knowledge Ownership Agent" "AI-powered agent that analyzes codebase ownership and provides insights." {
                
                webUI = container "Web UI" "Chat interface with thought process visualization." "Next.js, React, TailwindCSS"
                
                apiServer = container "API Server" "Handles chat requests and streaming." "Node.js, Express"
                
                langGraphAgent = container "LangGraph Agent" "7-node stateful agent graph for conversational AI." "TypeScript, LangGraph" {
                    
                    # Orchestration Layer
                    graphCompiler = component "Graph Compiler" "Compiles and executes the 7-node workflow." "LangGraph"
                    stateManager = component "State Manager" "Manages agent state with custom reducers." "Annotation API"
                    checkpointSaver = component "Checkpoint Saver" "Persists conversation state to MySQL." "MySQLSaver"
                    
                    # Agent Nodes
                    orchestratorNode = component "Orchestrator Node" "Initializes session with system context." "Node 1"
                    guardrailNode = component "Guardrail Node" "Blocks off-topic or unsafe queries." "Node 2"
                    intentParserNode = component "Intent Parser Node" "Classifies user intent and extracts entities." "Node 3"
                    queryPlannerNode = component "Query Planner Node" "Plans which tools to execute." "Node 4"
                    toolExecutorNode = component "Tool Executor Node" "Executes planned tools." "Node 5"
                    reflectorNode = component "Reflector Node" "Validates if sufficient data collected." "Node 6"
                    responseGeneratorNode = component "Response Generator Node" "Creates final user response." "Node 7"
                    
                    # Supporting Components
                    promptLoader = component "Prompt Loader" "Loads YAML prompts with COSTAR framework." "Utility"
                    toolRegistry = component "Tool Registry" "Provides 5 code analysis tools." "Mock Tools"
                }
                
                promptLibrary = container "Prompt Library" "COSTAR-formatted prompts for each node." "YAML files"
            }
            
            # External Systems
            llmService = softwareSystem "LLM Service" "Natural language understanding and generation." "OpenAI GPT-4"
            database = softwareSystem "MySQL Database" "Stores conversation checkpoints." "MySQL 8.0"
            codeRepository = softwareSystem "Code Repository" "Source of ownership data." "Git"
        }
        
        # User Relationships
        engineer -> webUI "Asks ownership questions via chat"
        techlead -> webUI "Reviews insights and metrics"
        
        # Container Relationships
        webUI -> apiServer "Sends chat messages" "WebSocket/HTTPS"
        apiServer -> langGraphAgent "Invokes graph execution"
        langGraphAgent -> promptLibrary "Loads prompts" "File System"
        langGraphAgent -> llmService "Calls LLM for reasoning" "REST API"
        langGraphAgent -> database "Saves/loads checkpoints" "MySQL protocol"
        langGraphAgent -> codeRepository "Analyzes ownership" "Git commands"
        
        # Component Relationships (within LangGraph Agent)
        
        # Graph Flow
        graphCompiler -> orchestratorNode "Starts execution"
        orchestratorNode -> guardrailNode "Passes control"
        guardrailNode -> intentParserNode "If allowed"
        intentParserNode -> queryPlannerNode "Passes classified intent"
        queryPlannerNode -> toolExecutorNode "If tools needed"
        queryPlannerNode -> responseGeneratorNode "If no tools needed"
        toolExecutorNode -> reflectorNode "Passes tool results"
        reflectorNode -> queryPlannerNode "If needs more data (loop)"
        reflectorNode -> responseGeneratorNode "If complete"
        
        # State Management
        orchestratorNode -> stateManager "Updates state"
        guardrailNode -> stateManager "Updates state"
        intentParserNode -> stateManager "Updates state"
        queryPlannerNode -> stateManager "Updates state"
        toolExecutorNode -> stateManager "Updates state"
        reflectorNode -> stateManager "Updates state"
        responseGeneratorNode -> stateManager "Updates state"
        
        # Supporting Components
        guardrailNode -> promptLoader "Loads guardrail prompt"
        intentParserNode -> promptLoader "Loads intent parser prompt"
        queryPlannerNode -> promptLoader "Loads planner prompt"
        reflectorNode -> promptLoader "Loads reflector prompt"
        responseGeneratorNode -> promptLoader "Loads generator prompt"
        
        toolExecutorNode -> toolRegistry "Executes tools"
        
        stateManager -> checkpointSaver "Persists state"
        checkpointSaver -> database "Writes checkpoints"
        
        # LLM Calls
        guardrailNode -> llmService "Binary decision (GPT-3.5)"
        intentParserNode -> llmService "Intent classification (GPT-4)"
        queryPlannerNode -> llmService "Tool selection (GPT-4)"
        reflectorNode -> llmService "Validation logic (GPT-3.5)"
        responseGeneratorNode -> llmService "NL synthesis (GPT-4)"
    }

    views {
        systemlandscape "SystemLandscape" {
            include *
            autoLayout
        }

        systemcontext agentSystem "SystemContext" {
            description "System Context diagram for Knowledge Ownership Agent"
            include *
            autoLayout
        }

        container agentSystem "Containers" {
            description "Container diagram showing major technology components"
            include *
            autoLayout
        }

        component langGraphAgent "LangGraphComponents" {
            description "Component diagram for the 7-node Agent Graph"
            include *
            autoLayout
        }

        # Deployment view (future)
        # deployment agentSystem "Production" "ProductionDeployment" {
        #     include *
        #     autoLayout
        # }

        styles {
            element "Person" {
                shape person
                background #08427B
                color #ffffff
            }

            element "Software System" {
                background #1168bd
                color #ffffff
            }

            element "Container" {
                background #438dd5
                color #ffffff
            }

            element "Component" {
                background #85bbf0
                color #000000
            }
            
            # Node highlighting
            element "Node 1" {
                background #90EE90
                color #000000
            }
            
            element "Node 2" {
                background #FFE4B5
                color #000000
            }
            
            element "Node 3" {
                background #B0E0E6
                color #000000
            }
            
            element "Node 4" {
                background #DDA0DD
                color #000000
            }
            
            element "Node 5" {
                background #F0E68C
                color #000000
            }
            
            element "Node 6" {
                background #FFA07A
                color #000000
            }
            
            element "Node 7" {
                background #98FB98
                color #000000
            }
        }
    }

    configuration {
        scope softwaresystem
    }
}
