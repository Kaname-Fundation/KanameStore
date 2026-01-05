import "./style.css";

export default function (proc, win) {
  win.render((root) => {
    root.innerHTML = "<h1>Hello from Source!</h1>";
  });
}
