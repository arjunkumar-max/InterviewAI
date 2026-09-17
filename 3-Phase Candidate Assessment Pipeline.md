```mermaid
flowchart LR
    Start([Candidate Login]) --> P1
    
    subgraph P1 [Phase 1: Context Extraction]
        A[Upload PDF Resume] --> B[ATS Text Extraction]
        B --> C[Generate 10 Dynamic Questions]
    end
    
    P1 --> P2
    
    subgraph P2 [Phase 2: Technical Defense]
        D[Proctored Text Chat] --> E[Anti-Cheat Monitoring]
        E --> F[10 Q&A Pairs Saved Locally]
    end
    
    P2 --> P3
    
    subgraph P3 [Phase 3: Behavioral Round]
        G[Generate 5 HR Questions] --> H[Voice Speech Recognition]
        H --> I[STAR Rubric Transcript]
    end
    
    P3 --> Final
    
    subgraph Final [Final Evaluation]
        J[60% Technical Weight] & K[40% HR Weight] --> L{Employability Index}
        L --> M([Placement Report Card])
    end

    %% Academic Monochrome Styling
    classDef default fill:#ffffff,stroke:#000000,stroke-width:1px,color:#000000;
    style P1 fill:#fcfcfc,stroke:#000000,stroke-width:1px,stroke-dasharray: 5 5;
    style P2 fill:#fcfcfc,stroke:#000000,stroke-width:1px,stroke-dasharray: 5 5;
    style P3 fill:#fcfcfc,stroke:#000000,stroke-width:1px,stroke-dasharray: 5 5;
    style Final fill:#fcfcfc,stroke:#000000,stroke-width:1px,stroke-dasharray: 5 5;
```
