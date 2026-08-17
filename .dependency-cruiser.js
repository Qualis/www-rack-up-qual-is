module.exports = {
  forbidden: [
    {
      name: "domain-no-outward-deps",
      comment:
        "Domain layer (core business rules) must not depend on outer layers",
      severity: "error",
      from: { path: "^src/domain" },
      to: {
        path: "^src/(application|infrastructure|app)",
        pathNot: "^src/domain",
      },
    },
    {
      name: "application-layer-boundaries",
      comment:
        "Application layer can only depend on domain, interfaces, and lib (utilities)",
      severity: "error",
      from: { path: "^src/application" },
      to: {
        path: "^src/(infrastructure|app)",
        pathNot: ["^src/(application|domain|interfaces|lib)"],
      },
    },
    {
      name: "no-ui-to-infrastructure-direct",
      comment:
        "UI layer should not directly depend on infrastructure implementations (except DI container)",
      severity: "warn",
      from: { path: "^src/app" },
      to: {
        path: "^src/infrastructure",
        pathNot: "^src/infrastructure/di",
      },
    },
    {
      name: "no-circular-dependencies",
      comment:
        "Circular dependencies make code harder to maintain and understand",
      severity: "error",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "lib-no-layer-deps",
      comment:
        "Utility/lib code should be independent and not depend on any architectural layers",
      severity: "error",
      from: { path: "^src/lib" },
      to: {
        path: "^src/(domain|application|infrastructure|app)",
      },
    },
    {
      name: "infrastructure-implements-ports",
      comment:
        "Infrastructure repositories should implement domain repository interfaces",
      severity: "warn",
      from: { path: "^src/infrastructure/repositories" },
      to: {
        path: "^src/app",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: "\\.(test|spec)\\.(ts|tsx|js|jsx)$",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "./tsconfig.json",
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
      archi: {
        collapsePattern:
          "^(node_modules|src/[^/]+|bin|test|spec|src/[^/]+/[^/]+)/",
      },
      text: {
        highlightFocused: true,
      },
    },
  },
};
