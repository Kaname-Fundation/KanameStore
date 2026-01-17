import { name as applicationName } from "./metadata.json";
import { h, app } from "hyperapp";
import { Box, Button, TextField, Toolbar, Statusbar } from "@osjs/gui";
import "./index.scss";

// Configuration - In a real app, this might be in a settings file
const DEFAULT_REPO =
  "https://raw.githubusercontent.com/Kaname-Fundation/KanameStore/refs/heads/live/repository.json";

const createView = (core, proc) => (state, actions) => {
  if (state.currentView === "progress") {
    return h(Box, { class: "kaname-store", padding: false, style: { display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' } }, [
      h("div", { style: { marginBottom: "15px", fontWeight: "bold", fontSize: "1.2rem" } }, "Installation Progress"),
      h("div", { style: { marginBottom: "10px", fontWeight: "bold" } }, state.installStatus),
      h("progress", { value: state.installProgress, max: 100, style: { width: "100%", marginBottom: "15px" } }),
      h("div", {
        style: {
          flex: 1,
          overflowY: "auto",
          border: "1px solid #333",
          background: "#000",
          color: "#fff",
          fontFamily: "monospace",
          padding: "5px",
          fontSize: "0.9em"
        }
      }, state.installLogs.map(log => h("div", {}, log))),
      h("div", { style: { marginTop: "10px", textAlign: "right" } },
        state.waitingForConfirmation ? [
          h("span", { style: { marginRight: "10px", fontWeight: "bold" } }, "Proceed with installation?"),
          h(Button, { onclick: actions.closeProgress }, "Cancel"),
          h(Button, { onclick: () => actions.proceedInstall({ core }), type: "primary" }, "Confirm & Install")
        ] : [
          h(Button, {
            onclick: actions.closeProgress,
            disabled: state.installProgress < 100 && state.installProgress > 0
          }, "Close")
        ]
      )
    ]);
  }

  const filteredApps = state.apps.filter((pkg) => {
    const query = state.search.toLowerCase();
    const name = pkg.name.toLowerCase();
    const desc = (pkg.description || "").toLowerCase();
    return name.includes(query) || desc.includes(query);
  });

  return h(Box, { class: "kaname-store" }, [
    h(Toolbar, { class: "store-toolbar" }, [
      h(TextField, {
        placeholder: "Search apps...",
        oninput: (ev, value) => actions.setSearch(value),
        value: state.search,
        box: { grow: 1 },
      }),
      h(
        Button,
        {
          onclick: () => actions.showRepoManager(),
        },
        "Repositories"
      ),
      h(
        Button,
        {
          onclick: () => actions.fetchApps(),
          disabled: state.loading,
        },
        "Refresh"
      ),
    ]),

    state.loading
      ? h(
        Box,
        { grow: 1, align: "center", justify: "center" },
        "Loading Store..."
      )
      : h(
        "div",
        { class: "store-grid" },
        filteredApps.map((pkg) => {
          const isInstalling = state.installing[pkg.name];
          const installedVersion = state.installedPackages[pkg.name];
          const isInstalled = !!installedVersion;
          // Check for updates by comparing version numbers
          const hasUpdate = isInstalled && installedVersion !== pkg.version;

          // Always use repository version and download for display and install
          const repoVersion = pkg.version;
          const repoDownload = pkg.download;

          let iconUrl = proc.resource("icon.png");

          if (pkg.icon) {
            iconUrl = pkg.icon.match(/^https?:\/\//)
              ? pkg.icon
              : `${pkg._repoBase}/${pkg.icon}`;
          } else if (pkg.iconName) {
            iconUrl = core.make("osjs/theme").icon(pkg.iconName);
          }

          const fallbackIcon = core.make("osjs/theme").icon("application-x-executable");

          let buttonText = "Install";
          let buttonDisabled = isInstalling;
          let buttonType = "primary";

          if (isInstalling) {
            buttonText = "Downloading...";
          } else if (hasUpdate) {
            buttonText = "Update";
            buttonType = "warning";
          } else if (isInstalled) {
            buttonText = "Installed";
            buttonDisabled = true;
          }

          return h("div", { class: "app-card" }, [
            h("img", {
              class: "app-icon",
              src: iconUrl,
              onerror: (ev) => {
                if (ev.target.src !== fallbackIcon) {
                  ev.target.src = fallbackIcon;
                }
              },
            }),
            h("div", { class: "app-name" }, pkg.title || pkg.name),
            h(
              "div",
              { class: "app-meta" },
              `v${repoVersion} • ${pkg.category}`
            ),
            h("div", { class: "app-desc" }, pkg.description),
            h(
              Button,
              {
                onclick: () => actions.installApp({ pkg, core }),
                disabled: buttonDisabled,
                type: buttonType,
              },
              buttonText
            ),
          ]);
        })
      ),

    h(Statusbar, {}, `Total Apps: ${state.apps.length}`),
  ]);
};

const register = (core, args, options, metadata) => {
  const proc = core.make("osjs/application", {
    args,
    options: {
      ...options,
      settings: {
        repositories: [DEFAULT_REPO]
      }
    },
    metadata
  });
  const settings = core.make("osjs/settings");

  proc
    .createWindow({
      id: "StoreWindow",
      title: metadata.title.en_EN,
      icon: proc.resource(metadata.icon),
      dimension: { width: 800, height: 600 },
    })
    .on("destroy", () => proc.destroy())
    .render(($content, win) => {
      // Load repositories from settings, ensure it's always an array
      let savedRepos = proc.settings.repositories;
      if (!Array.isArray(savedRepos) || savedRepos.length === 0) {
        savedRepos = [DEFAULT_REPO];
      }

      const a = app(
        {
          apps: [],
          search: "",
          loading: false,
          installing: {},
          installedPackages: {}, // Track installed packages in state
          repositories: savedRepos, // Load from settings
          currentView: "home", // "home" or "progress"
          installLogs: [],
          installProgress: 0,
          installStatus: "",
          waitingForConfirmation: false,
          pendingQueue: []
        },
        {
          setSearch: (search) => (state) => ({ search }),
          setApps: (apps) => (state) => ({ apps }),
          setLoading: (loading) => (state) => ({ loading }),
          setRepositories: (repositories) => (state) => {
            // Ensure repositories is always a non-empty array
            let validRepos = Array.isArray(repositories)
              ? repositories.filter(
                (url) => typeof url === "string" && url.length > 0
              )
              : [];
            if (validRepos.length === 0) {
              validRepos = [DEFAULT_REPO];
            }
            proc.settings.repositories = validRepos;
            proc.saveSettings();
            return { repositories: validRepos };
          },
          setInstalling:
            ({ name, value }) =>
              (state) => ({
                installing: { ...state.installing, [name]: value },
              }),

          setView: (view) => (state) => ({ currentView: view }),
          addLog: (msg) => (state) => ({ installLogs: [...state.installLogs, msg] }),
          updateProgress: ({ percent, status }) => (state) => ({
            installProgress: percent,
            installStatus: status || state.installStatus
          }),
          setWaitingForConfirmation: (val) => (state) => ({ waitingForConfirmation: val }),
          setPendingQueue: (list) => (state) => ({ pendingQueue: list }),

          closeProgress: () => (state) => ({
            currentView: "home",
            installLogs: [],
            installProgress: 0,
            installStatus: "Ready",
            waitingForConfirmation: false,
            pendingQueue: []
          }),

          refreshInstalled: () => (state) => {
            const installedPkgs = core.make("osjs/packages").getPackages();
            const installedPackages = {};
            installedPkgs.forEach((pkg) => {
              if (pkg.name) {
                installedPackages[pkg.name] = pkg.version || "1.0.0";
              }
            });
            return { installedPackages };
          },

          fetchApps: () => async (state, actions) => {
            actions.setLoading(true);
            try {
              const allApps = [];

              // Ensure repositories is always an array
              const repos =
                Array.isArray(state.repositories) &&
                  state.repositories.length > 0
                  ? state.repositories
                  : [DEFAULT_REPO];

              for (const repoUrl of repos) {
                try {
                  const response = await fetch(repoUrl);
                  const data = await response.json();
                  const repoBase = repoUrl.substring(
                    0,
                    repoUrl.lastIndexOf("/")
                  );

                  // Add repository info to each app
                  const apps = (data.apps || []).map((app) => ({
                    ...app,
                    _repoUrl: repoUrl,
                    _repoBase: repoBase,
                  }));

                  allApps.push(...apps);
                } catch (e) {
                  console.error(`Failed to fetch from ${repoUrl}:`, e);
                }
              }

              actions.setApps(allApps);
              actions.refreshInstalled(); // Refresh installed packages when fetching apps
            } catch (e) {
              console.error(e);
              core.make(
                "osjs/dialog",
                "alert",
                {
                  title: "Store Error",
                  message: "Failed to fetch repository: " + e.message,
                },
                () => { }
              );
            } finally {
              actions.setLoading(false);
            }
          },

          showRepoManager: () => (state, actions) => {
            // ... (keep showRepoManager as is, assume logic is same)
            // Wait, I must provide full content or I lose existing logic.
            // I'll paste the existing logic for showRepoManager.

            let win = core.make("osjs/window", {
              id: "RepoManagerWindow",
              title: "Manage Repositories",
              dimension: { width: 520, height: 400 },
              position: "center",
              attributes: { minHeight: 300, minWidth: 400 },
            });

            win.render(($content, win) => {
              $content.innerHTML = "";
              const container = document.createElement("div");
              container.style.height = "100%";
              container.style.width = "100%";
              $content.appendChild(container);

              setTimeout(() => {
                const initialRepos =
                  Array.isArray(state.repositories) &&
                    state.repositories.length > 0
                    ? [...state.repositories]
                    : [""];
                app(
                  {
                    repos: initialRepos,
                  },
                  {
                    setRepo: ({ idx, value }) => (state) => {
                      const repos = [...state.repos];
                      repos[idx] = value;
                      return { repos };
                    },
                    addRepo: () => (state) => ({ repos: [...state.repos, ""] }),
                    removeRepo: (idx) => (state) => {
                      const repos = [...state.repos];
                      repos.splice(idx, 1);
                      return { repos };
                    },
                    save: () => (state) => {
                      const repos = state.repos
                        .map((url) => url.trim())
                        .filter((url) => url.length > 0);
                      if (repos.length === 0) {
                        core.make("osjs/dialog", "alert", {
                          title: "Validation Error",
                          message: "Please enter at least one repository URL.",
                        });
                        return {};
                      }
                      actions.setRepositories(repos);
                      actions.fetchApps();
                      win.destroy();
                      return {};
                    },
                    cancel: () => () => {
                      win.destroy();
                      return {};
                    },
                  },
                  (state, actionsRepo) => // Renamed to actionsRepo to avoid confusion with outer actions
                    h(
                      Box,
                      { style: { padding: 16, height: "100%" }, grow: 1 },
                      [
                        h(
                          "div",
                          { style: { marginBottom: 12, fontWeight: "bold" } },
                          "Repository URLs:"
                        ),
                        ...state.repos.map((repo, idx) =>
                          h(
                            "div",
                            {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                padding: "5px",
                                borderBottom: "1px solid #ddd",
                                marginBottom: "5px"
                              },
                              key: idx
                            },
                            [
                              h(TextField, {
                                value: state.repos[idx],
                                placeholder: "https://... (e.g. raw.githubusercontent.com/...)",
                                oninput: (ev, value) => {
                                  const safeValue = value !== undefined ? value : (ev.target ? ev.target.value : ev);
                                  if (state.repos[idx] !== safeValue) {
                                    actionsRepo.setRepo({ idx, value: safeValue });
                                  }
                                },
                                box: { grow: 1 },
                                style: { marginRight: "8px" }
                              }),
                              h(
                                Button,
                                {
                                  onclick: () => actionsRepo.removeRepo(idx),
                                  disabled: state.repos.length === 1,
                                  title: "Remove this repository",
                                  style: { margin: 0, height: "auto", minWidth: "30px" }
                                },
                                "✕"
                              ),
                            ]
                          )
                        ),
                        h(
                          Button,
                          {
                            onclick: actionsRepo.addRepo,
                            style: { marginBottom: 16 },
                          },
                          "+ Add Repository"
                        ),
                        h(
                          Box,
                          {
                            horizontal: true,
                            style: {
                              marginTop: 16,
                              justifyContent: "flex-end",
                            },
                          },
                          [
                            h(
                              Button,
                              {
                                onclick: actionsRepo.cancel,
                                style: { marginRight: 8 },
                              },
                              "Cancel"
                            ),
                            h(
                              Button,
                              { onclick: actionsRepo.save, type: "primary" },
                              "Save"
                            ),
                          ]
                        ),
                      ]
                    ),
                  container
                );
              }, 0);
            });
          },

          installApp:
            ({ pkg, core }) =>
              async (state, actions) => {
                // Initialize Progress UI
                actions.setView("progress");
                actions.setWaitingForConfirmation(false);
                actions.setPendingQueue([]);
                actions.addLog(`Starting resolution for ${pkg.name}...`);
                actions.updateProgress({ percent: 10, status: "Resolving dependencies..." });

                const log = (msg) => {
                  actions.addLog(msg);
                };

                // Helper to resolve dependencies recursively
                const resolveDependencies = (targetPkg, allApps, visited = new Set()) => {
                  if (visited.has(targetPkg.name)) return [];
                  visited.add(targetPkg.name);

                  let list = [];
                  if (targetPkg.dependencies && Array.isArray(targetPkg.dependencies)) {
                    targetPkg.dependencies.forEach(depName => {
                      const depPkg = allApps.find(a => a.name === depName);
                      if (depPkg) {
                        list = [...list, ...resolveDependencies(depPkg, allApps, visited)];
                      } else {
                        log(`[WARN] Dependency '${depName}' not found.`);
                      }
                    });
                  }
                  list.push(targetPkg);
                  return list;
                };

                // 1. Resolve Tree
                const queue = resolveDependencies(pkg, state.apps);

                // 2. Filter already installed (But allow the main pkg to update)
                const installedNames = core.make("osjs/packages").getPackages()
                  .filter(p => p.name)
                  .map(p => p.name);

                const toInstall = queue.filter(p => p.name === pkg.name || !installedNames.includes(p.name));

                if (toInstall.length === 0) {
                  log("All packages already installed.");
                  actions.updateProgress({ percent: 100, status: "Done" });
                  return;
                }

                log(`Installation Queue: ${toInstall.map(p => p.name).join(", ")}`);
                log("Waiting for user confirmation...");

                actions.setPendingQueue(toInstall);
                actions.setWaitingForConfirmation(true);
                actions.updateProgress({ percent: 20, status: "Waiting for confirmation..." });
              },

          proceedInstall:
            ({ core }) =>
              async (state, actions) => {
                actions.setWaitingForConfirmation(false);
                const toInstall = state.pendingQueue;

                const log = (msg) => actions.addLog(msg);
                const progress = (pct, status) => actions.updateProgress({ percent: pct, status });

                log("Confirmation received. Proceeding...");

                try {
                  const total = toInstall.length;
                  for (let i = 0; i < total; i++) {
                    const p = toInstall[i];
                    const currentStepBase = 20 + ((i / total) * 80);

                    actions.setInstalling({ name: p.name, value: true });
                    progress(currentStepBase, `Downloading ${p.name}...`);
                    log(`Downloading ${p.name}...`);

                    // Download
                    let downloadUrl = p.download;
                    if (!downloadUrl.match(/^https?:\/\//)) {
                      downloadUrl = `${p._repoBase}/${p.download}`;
                    }

                    const response = await fetch(downloadUrl);
                    if (!response.ok) throw new Error(`Failed to download ${p.name}`);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();

                    // Save to VFS
                    const filename = `${p.name}-${p.version}.wpk`;
                    const destPath = `tmp:/${filename}`;

                    const formData = new FormData();
                    formData.append("upload", new Blob([arrayBuffer]));
                    formData.append("path", destPath);

                    log(`Writing ${filename} to VFS...`);
                    await core.request("/vfs/writefile", { method: "POST", body: formData });

                    // Install Silently
                    progress(currentStepBase + (40 / total), `Installing ${p.name}...`);
                    log(`Installing ${p.name}...`);
                    const result = await core.request("/packages/install", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ vfsPath: destPath })
                    }).then(res => res.json());

                    if (!result.success) throw new Error(`Failed to install ${p.name}: ${result.error}`);

                    log(`Successfully installed ${p.name}.`);

                    // Refresh Local State
                    actions.setInstalling({ name: p.name, value: false });
                  }

                  // Done
                  progress(100, "Installation Complete!");
                  log("All operations completed successfully.");
                  actions.refreshInstalled();
                  core.make("osjs/notification", { title: "Store", message: `Package installed successfully.` });

                } catch (e) {
                  console.error(e);
                  log(`[ERROR] ${e.message}`);
                  progress(100, "Installation Failed");
                  core.make("osjs/dialog", "alert", { title: "Installation Failed", message: e.message });
                } finally {
                  // Ensure flags are cleared
                  toInstall.forEach(p => actions.setInstalling({ name: p.name, value: false }));
                  actions.setPendingQueue([]);
                }
              }
        },
        createView(core, proc),
        $content
      );

      // Initial fetch and refresh installed packages
      a.fetchApps();
      a.refreshInstalled();
    });

  return proc;
};

// Register the package in the OS.js core
OSjs.make("osjs/packages").register(applicationName, register);

export { register, applicationName };
