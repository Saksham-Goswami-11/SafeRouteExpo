# 🏗️ SafeRoute Expo - System Architecture Diagram

## 📋 Overview

This document provides a comprehensive visual and technical overview of the SafeRouteExpo mobile application architecture, showing how different components interact and data flows throughout the system.

## 🎯 High-Level Architecture

```mermaid
graph TB
    subgraph "Mobile App (React Native + Expo)"
        UI[User Interface Layer]
        NAV[Navigation Layer]
        CTX[Context Layer]
        SVC[Service Layer] 
        DB[(SQLite Database)]
    end
    
    subgraph "Device Features"
        GPS[GPS/Location]
        ACCEL[Accelerometer]
        STORAGE[AsyncStorage]
    end
    
    subgraph "External Services"
        MAPS[Google Maps API]
        WA[WhatsApp Deep Links]
        GEO[Geocoding Service]
    end
    
    UI --> NAV
    NAV --> CTX
    CTX --> SVC
    SVC --> DB
    
    SVC --> GPS
    SVC --> ACCEL
    SVC --> STORAGE
    
    SVC --> MAPS
    SVC --> WA
    SVC --> GEO
    
    style UI fill:#6366F1,stroke:#fff,color:#fff
    style DB fill:#10B981,stroke:#fff,color:#fff
    style GPS fill:#EC4899,stroke:#fff,color:#fff
    style MAPS fill:#F59E0B,stroke:#fff,color:#fff
```

## 🏛️ Detailed Architecture Layers

### 1. **User Interface Layer**
```mermaid
graph LR
    subgraph "Screens"
        HOME[Home Screen]
        MAP[Map Screen]
        PROFILE[Profile Screen]
        AUTH[Auth Screens]
    end
    
    subgraph "Components"
        BUTTONS[Buttons]
        CARDS[Cards]
        MODALS[Modals]
        FORMS[Forms]
    end
    
    HOME --> BUTTONS
    MAP --> CARDS
    PROFILE --> FORMS
    AUTH --> MODALS
    
    style HOME fill:#6366F1,stroke:#fff,color:#fff
    style MAP fill:#8B5CF6,stroke:#fff,color:#fff
    style PROFILE fill:#EC4899,stroke:#fff,color:#fff
```

**Key Components:**
- **Home Screen**: Dashboard with quick actions and safety score
- **Map Screen**: Interactive navigation with route planning
- **Profile Screen**: User management and settings
- **Auth Screens**: Login/Signup with form validation

### 2. **Navigation Layer**
```mermaid
graph TB
    ROOT[App Root]
    THEME[Theme Provider]
    AUTH_PROVIDER[Auth Provider]
    SOS_PROVIDER[SOS Provider]
    
    MAIN_TAB[Main Tab Navigator]
    PROFILE_STACK[Profile Stack Navigator]
    
    ROOT --> THEME
    THEME --> AUTH_PROVIDER
    AUTH_PROVIDER --> SOS_PROVIDER
    SOS_PROVIDER --> MAIN_TAB
    SOS_PROVIDER --> PROFILE_STACK
    
    subgraph "Tab Screens"
        TAB_HOME[🏠 Home]
        TAB_MAP[🗺️ Navigate]
        TAB_SAFETY[🛡️ Safety]
        TAB_PROFILE[👤 Profile]
    end
    
    MAIN_TAB --> TAB_HOME
    MAIN_TAB --> TAB_MAP
    MAIN_TAB --> TAB_SAFETY
    MAIN_TAB --> TAB_PROFILE
    
    TAB_PROFILE --> PROFILE_STACK
    
    style MAIN_TAB fill:#6366F1,stroke:#fff,color:#fff
    style PROFILE_STACK fill:#8B5CF6,stroke:#fff,color:#fff
```

### 3. **Context & State Management**
```mermaid
graph TB
    subgraph "Context Providers"
        AUTH_CTX[AuthContext]
        THEME_CTX[ThemeContext]
        SOS_CTX[SOSContext]
    end
    
    subgraph "Auth State"
        USER[Current User]
        PROFILE[User Profile]
        SESSION[Auth Session]
    end
    
    subgraph "Theme State"
        COLORS[Color Scheme]
        DARK_MODE[Dark Mode Toggle]
    end
    
    subgraph "SOS State"
        SOS_ENABLED[SOS Enabled]
        SHAKE_DETECT[Shake Detection]
    end
    
    AUTH_CTX --> USER
    AUTH_CTX --> PROFILE
    AUTH_CTX --> SESSION
    
    THEME_CTX --> COLORS
    THEME_CTX --> DARK_MODE
    
    SOS_CTX --> SOS_ENABLED
    SOS_CTX --> SHAKE_DETECT
    
    style AUTH_CTX fill:#10B981,stroke:#fff,color:#fff
    style THEME_CTX fill:#8B5CF6,stroke:#fff,color:#fff
    style SOS_CTX fill:#EC4899,stroke:#fff,color:#fff
```

### 4. **Service Layer Architecture**
```mermaid
graph TB
    subgraph "Authentication Services"
        AUTH_SVC[firebaseClient.ts]
        USER_SVC[userService.ts]
    end
    
    subgraph "Data Services"
        PROFILE_SVC[profileService.ts]
        ADDRESS_SVC[addressService.ts]
        CONTACT_SVC[contactsService.ts]
    end
    
    subgraph "Core Services"
        SQLITE_SVC[sqlite.ts]
        SAFETY_SVC[safetyAnalysis.ts]
    end
    
    subgraph "Feature Services"
        SOS_HOOK[useShakeSOS.ts]
    end
    
    AUTH_SVC --> SQLITE_SVC
    USER_SVC --> SQLITE_SVC
    PROFILE_SVC --> SQLITE_SVC
    ADDRESS_SVC --> SQLITE_SVC
    CONTACT_SVC --> SQLITE_SVC
    
    SOS_HOOK --> CONTACT_SVC
    
    style SQLITE_SVC fill:#10B981,stroke:#fff,color:#fff
    style SAFETY_SVC fill:#F59E0B,stroke:#fff,color:#fff
    style SOS_HOOK fill:#EC4899,stroke:#fff,color:#fff
```

## 🗄️ Database Architecture

```mermaid
erDiagram
    USERS {
        TEXT id PK
        TEXT email UK
        TEXT full_name
        TEXT password_hash
        INTEGER created_at
    }
    
    AUTH_SESSIONS {
        TEXT id PK
        TEXT user_id FK
        TEXT token UK
        INTEGER expires_at
        INTEGER created_at
    }
    
    PROFILES {
        TEXT user_id PK_FK
        TEXT full_name
        INTEGER dark_mode
        INTEGER created_at
        INTEGER updated_at
    }
    
    EMERGENCY_CONTACTS {
        TEXT id PK
        TEXT user_id FK
        TEXT name
        TEXT phone
        TEXT relation
        INTEGER is_primary
        INTEGER created_at
    }
    
    SAVED_ADDRESSES {
        TEXT id PK
        TEXT user_id FK
        TEXT label
        TEXT address_text
        REAL latitude
        REAL longitude
        INTEGER created_at
    }
    
    USERS ||--o{ AUTH_SESSIONS : "has many"
    USERS ||--|| PROFILES : "has one"
    USERS ||--o{ EMERGENCY_CONTACTS : "has many"
    USERS ||--o{ SAVED_ADDRESSES : "has many"
```

## 🔄 Data Flow Diagrams

### Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant UI as Login Screen
    participant AC as AuthContext
    participant FC as firebaseClient
    participant DB as SQLite
    participant AS as AsyncStorage
    
    U->>UI: Enter credentials
    UI->>AC: login(email, password)
    AC->>FC: signInWithEmailAndPassword()
    FC->>DB: authenticateUser()
    DB-->>FC: User data
    FC->>DB: createSession()
    DB-->>FC: Session token
    FC->>AS: Store token
    FC-->>AC: User object
    AC-->>UI: Success
    UI-->>U: Navigate to app
```

### SOS Emergency Flow
```mermaid
sequenceDiagram
    participant U as User
    participant D as Device
    participant SOS as useShakeSOS
    participant LOC as Location Service
    participant CON as Contact Service
    participant WA as WhatsApp
    
    U->>D: Shake device twice
    D->>SOS: Accelerometer trigger
    SOS->>LOC: Get current position
    LOC-->>SOS: GPS coordinates
    SOS->>LOC: Reverse geocode
    LOC-->>SOS: Address text
    SOS->>CON: Fetch emergency contacts
    CON-->>SOS: Contact list
    
    loop For each contact
        SOS->>WA: Open with message
        WA-->>SOS: Success
    end
```

### Safety Route Analysis Flow
```mermaid
sequenceDiagram
    participant U as User
    participant MAP as Map Screen
    participant SA as Safety Analysis
    participant GEO as Geocoding
    participant UI as UI Update
    
    U->>MAP: Enter start/end locations
    MAP->>GEO: Geocode addresses
    GEO-->>MAP: Coordinates
    MAP->>SA: Generate route points
    SA-->>MAP: Route coordinates
    MAP->>SA: Analyze safety segments
    SA-->>MAP: Safety scores & colors
    MAP->>UI: Render colored route
    UI-->>U: Display safety visualization
```

## 🔧 Component Integration

### Map Screen Integration
```mermaid
graph TB
    subgraph "MapScreen Components"
        MAP_COMP[MapView Component]
        ROUTE_INPUT[Route Input Modal]
        SAFETY_CARD[Safety Score Card]
        SEGMENT_MODAL[Segment Info Modal]
    end
    
    subgraph "Services Used"
        LOCATION[Location Service]
        GEOCODE[Geocoding Service]
        SAFETY[Safety Analysis]
        ADDRESS[Address Service]
    end
    
    subgraph "State Management"
        ROUTE_STATE[Route Coordinates]
        SAFETY_STATE[Safety Segments]
        UI_STATE[Modal Visibility]
    end
    
    MAP_COMP --> LOCATION
    ROUTE_INPUT --> GEOCODE
    ROUTE_INPUT --> ADDRESS
    SAFETY_CARD --> SAFETY
    SEGMENT_MODAL --> SAFETY_STATE
    
    LOCATION --> ROUTE_STATE
    SAFETY --> SAFETY_STATE
    UI_STATE --> ROUTE_INPUT
    UI_STATE --> SAFETY_CARD
    
    style MAP_COMP fill:#6366F1,stroke:#fff,color:#fff
    style SAFETY fill:#10B981,stroke:#fff,color:#fff
```

## 🔐 Security Architecture

```mermaid
graph TB
    subgraph "Security Layer"
        HASH[Password Hashing]
        TOKEN[Token Generation]
        SESSION[Session Management]
        ENCRYPT[Data Encryption]
    end
    
    subgraph "Authentication Flow"
        LOGIN[Login Process]
        VALIDATE[Token Validation]
        REFRESH[Session Refresh]
        LOGOUT[Secure Logout]
    end
    
    subgraph "Data Protection"
        LOCAL[Local Storage]
        ISOLATION[User Isolation]
        CLEANUP[Auto Cleanup]
    end
    
    HASH --> LOGIN
    TOKEN --> VALIDATE
    SESSION --> REFRESH
    ENCRYPT --> LOCAL
    
    VALIDATE --> ISOLATION
    REFRESH --> CLEANUP
    
    style HASH fill:#EC4899,stroke:#fff,color:#fff
    style TOKEN fill:#F59E0B,stroke:#fff,color:#fff
    style LOCAL fill:#10B981,stroke:#fff,color:#fff
```

## 🌐 External Integrations

### Third-Party Services
```mermaid
graph LR
    subgraph "SafeRoute App"
        CORE[Core App]
    end
    
    subgraph "Location Services"
        GPS[Device GPS]
        MAPS_API[Google Maps API]
        GEOCODE_API[Geocoding API]
    end
    
    subgraph "Communication"
        WHATSAPP[WhatsApp]
        DEEP_LINKS[Deep Link Handling]
    end
    
    subgraph "Device Features"
        ACCELEROMETER[Accelerometer]
        STORAGE_API[Async Storage]
        PERMISSIONS[Permission System]
    end
    
    CORE --> GPS
    CORE --> MAPS_API
    CORE --> GEOCODE_API
    CORE --> WHATSAPP
    CORE --> ACCELEROMETER
    CORE --> STORAGE_API
    
    GPS --> PERMISSIONS
    WHATSAPP --> DEEP_LINKS
    
    style CORE fill:#6366F1,stroke:#fff,color:#fff
    style WHATSAPP fill:#25D366,stroke:#fff,color:#fff
    style GPS fill:#EC4899,stroke:#fff,color:#fff
```

## 📱 Platform Architecture

### Cross-Platform Support
```mermaid
graph TB
    subgraph "Expo Framework"
        EXPO_SDK[Expo SDK ~54.0.9]
        EXPO_CLI[Expo CLI]
        EAS_BUILD[EAS Build]
    end
    
    subgraph "React Native Core"
        RN_CORE[React Native 0.81.4]
        JS_ENGINE[JavaScript Engine]
        NATIVE_MODULES[Native Modules]
    end
    
    subgraph "Platform Targets"
        IOS[iOS App]
        ANDROID[Android App]
        WEB[Web App]
    end
    
    EXPO_SDK --> RN_CORE
    RN_CORE --> JS_ENGINE
    RN_CORE --> NATIVE_MODULES
    
    EAS_BUILD --> IOS
    EAS_BUILD --> ANDROID
    EXPO_CLI --> WEB
    
    style EXPO_SDK fill:#000,stroke:#fff,color:#fff
    style IOS fill:#007AFF,stroke:#fff,color:#fff
    style ANDROID fill:#3DDC84,stroke:#fff,color:#fff
```

## 🔄 Development Workflow

```mermaid
graph LR
    subgraph "Development"
        CODE[Code Changes]
        SAVE[Save Files]
        REFRESH[Fast Refresh]
    end
    
    subgraph "Metro Bundler"
        METRO[Metro Server]
        BUNDLE[JS Bundle]
        HMR[Hot Module Reload]
    end
    
    subgraph "Device"
        EXPO_GO[Expo Go App]
        DEVICE[Physical Device]
        UPDATE[Live Update]
    end
    
    CODE --> SAVE
    SAVE --> METRO
    METRO --> BUNDLE
    BUNDLE --> HMR
    HMR --> EXPO_GO
    EXPO_GO --> UPDATE
    UPDATE --> DEVICE
    
    REFRESH --> METRO
    
    style METRO fill:#6366F1,stroke:#fff,color:#fff
    style UPDATE fill:#10B981,stroke:#fff,color:#fff
```

## 📊 Performance Architecture

### Optimization Strategies
```mermaid
graph TB
    subgraph "Frontend Optimization"
        LAZY[Lazy Loading]
        MEMO[React Memo]
        CONTEXT[Context Optimization]
    end
    
    subgraph "Database Optimization"
        INDEXES[SQLite Indexes]
        QUERIES[Optimized Queries]
        TRANSACTIONS[Batch Transactions]
    end
    
    subgraph "Memory Management"
        CLEANUP[Component Cleanup]
        SUBSCRIPTIONS[Event Unsubscribe]
        CACHE[Smart Caching]
    end
    
    LAZY --> MEMO
    MEMO --> CONTEXT
    
    INDEXES --> QUERIES
    QUERIES --> TRANSACTIONS
    
    CLEANUP --> SUBSCRIPTIONS
    SUBSCRIPTIONS --> CACHE
    
    style LAZY fill:#10B981,stroke:#fff,color:#fff
    style INDEXES fill:#F59E0B,stroke:#fff,color:#fff
    style CLEANUP fill:#EC4899,stroke:#fff,color:#fff
```

---

## 📝 Architecture Summary

### **Key Design Principles:**
1. **Offline-First**: SQLite database ensures full functionality without internet
2. **Modular Design**: Clear separation between UI, business logic, and data layers
3. **Security-Focused**: Local authentication with secure session management
4. **Cross-Platform**: Single codebase for iOS, Android, and Web
5. **Performance-Optimized**: Efficient state management and database operations

### **Technology Decisions:**
- **React Native + Expo**: Rapid development with native performance
- **SQLite**: Reliable offline storage with strong consistency
- **Context API**: Simple state management without external dependencies
- **TypeScript**: Type safety and better developer experience

### **Scalability Considerations:**
- **Service Layer**: Easy to extend with new features
- **Database Schema**: Flexible design for future requirements
- **Component Architecture**: Reusable components and clear separation
- **External Integrations**: Loosely coupled third-party services

This architecture provides a solid foundation for a production-ready safety navigation application with room for future enhancements and scaling.