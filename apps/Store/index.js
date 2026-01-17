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

  if (state.currentView === "updates") {
    const updates = state.apps.filter(pkg => {
      const installedVersion = state.installedPackages[pkg.name];
      return installedVersion && installedVersion !== pkg.version;
    });

    return h(Box, { class: "kaname-store", padding: false, style: { display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' } }, [
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" } }, [
        h("h2", { style: { margin: 0 } }, "Available Updates"),
        h(Button, { onclick: () => actions.setView("home") }, "Back to Store")
      ]),

      updates.length === 0
        ? h("div", { style: { padding: "20px", textAlign: "center" } }, "No updates available. You are up to date!")
        : [
          h("div", { style: { marginBottom: "20px" } }, [
            h(Button, {
              type: "primary",
              onclick: () => actions.updateAll({ updates, core })
            }, `Update All (${updates.length})`)
          ]),
          h("div", { style: { overflowY: "auto", flex: 1 } },
            updates.map(pkg => {
              const installedVersion = state.installedPackages[pkg.name];
              return h("div", { class: "app-card", style: { display: "flex", flexDirection: "row", alignItems: "center", height: "auto", minHeight: "80px", marginBottom: "10px", width: "100%" } }, [
                h("div", { style: { flex: 1 } }, [
                  h("div", { class: "app-name" }, pkg.title || pkg.name),
                  h("div", { class: "app-meta" }, `Current: v${installedVersion} → New: v${pkg.version}`),
                ]),
                h(Button, { onclick: () => actions.installApp({ pkg, core }) }, "Update")
              ]);
            })
          )
        ]
    ]);
  }

  if (state.currentView === "repositories") {
    return h(Box, { class: "kaname-store", padding: false, style: { display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' } }, [
      h("h2", { style: { marginTop: 0 } }, "Manage Repositories"),
      h("div", { style: { marginBottom: "15px", flex: 1, overflowY: "auto" } }, [
        h("div", { style: { marginBottom: 12, fontWeight: "bold" } }, "Repository URLs:"),
        ...state.tempRepositories.map((repo, idx) =>
          h("div", { style: { display: "flex", alignItems: "center", marginBottom: "5px" } }, [
            h(TextField, {
              value: repo,
              placeholder: "https://...",
              oninput: (ev, value) => actions.updateRepo({ idx, value }),
              box: { grow: 1 },
              style: { marginRight: "8px" }
            }),
            h(Button, {
              onclick: () => actions.removeRepo(idx),
              disabled: state.tempRepositories.length === 1,
              title: "Remove this repository"
            }, "✕")
          ])
        ),
        h(Button, { onclick: actions.addRepo }, "+ Add Repository")
      ]),
      h("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: "10px" } }, [
        h(Button, { onclick: () => actions.setView("home"), style: { marginRight: "8px" } }, "Cancel"),
        h(Button, { onclick: actions.saveRepos, type: "primary" }, "Save & Reload")
      ])
    ]);
  }

  const filteredApps = state.apps.filter((pkg) => {
    const query = state.search.toLowerCase();
    const name = pkg.name.toLowerCase();
    const desc = (pkg.description || "").toLowerCase();
    return name.includes(query) || desc.includes(query);
  });

  // Calculate update count for badge
  const updateCount = state.apps.filter(pkg => {
    const installedVersion = state.installedPackages[pkg.name];
    return installedVersion && installedVersion !== pkg.version;
  }).length;

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
          onclick: () => actions.setView("updates"),
          style: { position: "relative" }
        },
        [
          "Updates",
          updateCount > 0 ? h("span", {
            style: {
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "0.8em",
              marginLeft: "5px",
              verticalAlign: "middle"
            }
          }, updateCount) : null
        ]
      ),
      h(
        Button,
        {
          onclick: () => actions.openRepoManager(),
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
          currentView: "home", // "home" or "progress" or "updates" or "repositories"
          tempRepositories: [],
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

          // Repository Actions
          openRepoManager: () => (state) => ({
            currentView: "repositories",
            tempRepositories: Array.isArray(state.repositories) && state.repositories.length > 0
              ? [...state.repositories]
              : [""]
          }),

          addRepo: () => (state) => ({
            tempRepositories: [...state.tempRepositories, ""]
          }),

          removeRepo: (idx) => (state) => {
            const repos = [...state.tempRepositories];
            repos.splice(idx, 1);
            return { tempRepositories: repos };
          },

          updateRepo: ({ idx, value }) => (state) => {
            const repos = [...state.tempRepositories];
            repos[idx] = value;
            return { tempRepositories: repos };
          },

          saveRepos: () => (state, actions) => {
            const repos = state.tempRepositories
              .map((url) => url.trim())
              .filter((url) => url.length > 0);

            if (repos.length === 0) {
              core.make("osjs/dialog", "alert", {
                title: "Validation Error",
                message: "Please enter at least one repository URL.",
              });
              return;
            }

            actions.setRepositories(repos);
            actions.fetchApps();
            actions.setView("home");
          },

          setInstalledPackage: ({ name, version }) => (state) => ({
            installedPackages: { ...state.installedPackages, [name]: version }
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

          // ... fetchApps ...

          // ... (keep fetchApps and showRepoManager same) ...

          // ... inside proceedInstall ...


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

          // Legacy showRepoManager removed



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

          updateAll:
            ({ updates, core }) =>
              async (state, actions) => {
                actions.setView("progress");
                actions.setWaitingForConfirmation(false);
                actions.setPendingQueue([]);
                actions.addLog(`Preparing to update ${updates.length} packages...`);
                actions.updateProgress({ percent: 10, status: "Preparing updates..." });

                // Add all updates to the queue
                // Note: We skip dependency resolution check for now as we assume updates are safe/resolved
                // or we could run resolution for each. For simplicity, we just queue them.

                actions.setPendingQueue(updates);
                actions.setWaitingForConfirmation(true);
                actions.updateProgress({ percent: 20, status: `Ready to update ${updates.length} apps. Waiting for confirmation...` });
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

                    const contentLength = response.headers.get('content-length');
                    const totalLength = contentLength ? parseInt(contentLength, 10) : null;

                    let arrayBuffer;

                    if (totalLength && response.body) {
                      const reader = response.body.getReader();
                      const chunks = [];
                      let receivedLength = 0;

                      const stepSize = 40 / total; // Max percentage gain for this download step

                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        chunks.push(value);
                        receivedLength += value.length;

                        const percent = (receivedLength / totalLength) * 100;
                        const overallProgress = currentStepBase + ((percent / 100) * stepSize);

                        progress(overallProgress, `Downloading ${p.name} (${Math.round(percent)}%)...`);
                      }

                      const blob = new Blob(chunks);
                      arrayBuffer = await blob.arrayBuffer();
                    } else {
                      const blob = await response.blob();
                      arrayBuffer = await blob.arrayBuffer();
                    }

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
                    actions.setInstalledPackage({ name: p.name, version: p.version });
                  }

                  // Done
                  progress(100, "Installation Complete!");
                  log("All operations completed successfully.");
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
