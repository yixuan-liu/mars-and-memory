# MilitaryHistoryVision 系统架构文档

## 文档版本：1.0
## 生成日期：2025年1月25日

---

# 一、系统概述

## 1.1 项目简介

**MilitaryHistoryVision** 是一个基于 DeepAgent 框架的黑白历史军服照片彩色还原系统。系统通过 JSON Schema 范式驱动的结构化知识库，结合多模态大模型，实现高可信度的历史军服色彩还原。

## 1.2 核心价值

- 🔬 **历史精确性**：基于历史文献和档案的精准色彩还原
- 🧠 **结构化知识**：JSON Schema 驱动的规范表达
- 🤖 **自动化流程**：DeepAgent 驱动的多 Agent 协作
- 📚 **可追溯性**：完整的数据来源和置信度评估

---

# 二、整体系统架构

## 2.1 架构层次图

```mermaid
graph TB
    subgraph Client["客户端层"]
        User[用户界面]
        API[API网关]
    end
    
    subgraph Core["核心处理层"]
        subgraph Orchestrator["Orchestrator Agent"]
            O_Main[主控Agent]
            O_Planning[规划模块]
            O_Memory[记忆管理]
            O_Context[上下文管理]
        end
        
        subgraph Agents["Agent链路"]
            A1[ImageAnalysis]
            A2[PeriodIdentification]
            A3[KnowledgeRetrieval]
            A4[SchemaGeneration]
            A5[PromptConstruction]
            A6[MultiModalColor]
            A7[PostProcess]
            A8[ExpertReview]
            A9[OutputCompile]
        end
    end
    
    subgraph Tools["工具层"]
        T_Image[图像工具]
        T_Database[数据库工具]
        T_Schema[Schema工具]
        T_Model[模型工具]
    end
    
    subgraph Memory["记忆层"]
        M_Episodic[Episodic Memory]
        M_Semantic[Semantic Memory]
        M_Procedural[Procedural Memory]
        M_File[文件系统]
    end
    
    subgraph Data["数据层"]
        D_Vector[(向量数据库)]
        D_Graph[(知识图谱)]
        D_Relation[(关系数据库)]
        D_File[文件存储]
    end
    
    subgraph External["外部服务"]
        E_AI[多模态AI服务]
        E_Image[图像处理服务]
    end
    
    User --> API
    API --> O_Main
    O_Main <--> O_Planning
    O_Main <--> O_Memory
    O_Main <--> O_Context
    
    O_Main --> A1
    O_Main --> A2
    O_Main --> A3
    O_Main --> A4
    O_Main --> A5
    O_Main --> A6
    O_Main --> A7
    O_Main --> A8
    O_Main --> A9
    
    A1 --> T_Image
    A3 --> T_Database
    A4 --> T_Schema
    A5 --> T_Model
    A6 --> T_Model
    
    T_Image --> E_Image
    T_Database --> D_Vector
    T_Database --> D_Graph
    T_Database --> D_Relation
    T_Model --> E_AI
    
    O_Memory --> M_Episodic
    O_Memory --> M_Semantic
    O_Memory --> M_Procedural
    O_Memory --> M_File
    
    M_File --> D_File
