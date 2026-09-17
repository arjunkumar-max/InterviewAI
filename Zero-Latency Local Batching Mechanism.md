```mermaid
flowchart TD
    subgraph Traditional [Traditional LLM Chat: High Latency]
        direction TB
        T1[Ask Q1] --> T2((Wait 3s)) --> T3[LLM API Call] --> T4[Ask Q2] --> T5((Wait 3s)) --> T6[LLM API Call]
    end

    subgraph HireSense [HireSense AI: Zero-Latency Batching]
        direction TB
        H1[Ask Q1] -->|0ms Local State| H2[Ask Q2] 
        H2 -->|0ms Local State| H3[Ask Q3...]
        H3 -->|0ms Local State| H4[Ask Q10]
        H4 -->|End of Round| H5{Single Batch API Call}
        H5 --> H6[Holistic AI Report Card]
    end

    %% Academic Monochrome Styling
    classDef default fill:#ffffff,stroke:#000000,stroke-width:1px,color:#000000;
    style Traditional fill:#ffffff,stroke:#000000,stroke-width:1px,stroke-dasharray: 5 5;
    style HireSense fill:#f4f4f4,stroke:#000000,stroke-width:1px,stroke-dasharray: 5 5;
```
