const alertStyles = {
  info: {
    class: "alert-info",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
    `, // shortened for brevity
  },
  error: {
    class: "alert-error",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>`,
  },
  warning: {
    class: "alert-warning",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>`,
  },
  success: {
    class: "alert-success",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
  </svg>`,
  },
} as const;

type AlertType = keyof typeof alertStyles;

type Position =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "middle"
  | "top"
  | "bottom"
  | "left"
  | "right";

function createToast(type: AlertType, title: string, message: string) {
  const alertConfig = alertStyles[type] || alertStyles.info;

  return `
      <div class="alert ${alertConfig.class} shadow-lg flex justify-between items-start p-2 rounded-md">
          <div class="flex flex-col w-full">
              <div class="flex justify-between items-center mb-2">
                  <div class="flex items-center">
                      ${alertConfig.icon}
                      <h3 class="font-bold text-lg ml-2">${title}</h3>
                  </div>
                  <button class="btn btn-circle btn-sm" onclick="window.removeWindToast(event)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
              </div>
              <div class="text-md mb-2">${message}</div>
              <div class="w-full">
                  <progress class="progress progress-primary w-full h-2 rounded-full" value="50" max="100"></progress>
              </div>
          </div>
      </div>
  `;
}

const info = (title: string, message: string) =>
  createToast("info", title, message);
const error = (title: string, message: string) =>
  createToast("error", title, message);
const warning = (title: string, message: string) =>
  createToast("warning", title, message);
const success = (title: string, message: string) =>
  createToast("success", title, message);

class Toast {
  public async success(message: string, title?: string) {
    await newToast(title ?? "", message, "success");
  }
  public async error(message: string, title?: string) {
    await newToast(title ?? "", message, "error");
    console.error(`[toast] ${title} - ${message}`);
  }
  public async info(message: string, title?: string) {
    await newToast(title ?? "", message, "info");
  }
  public async warning(message: string, title?: string) {
    await newToast(title ?? "", message, "warning");
  }
}

export const toast = new Toast();

const newToast = async (
  title: string,
  message: string,
  alertType: AlertType,
  duration = 10,
  position: Position = "bottom-right",
  zIndex = 10000,
) => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") return;

  // Get the body element
  const body = document.querySelector("body")!;
  const containerId = "wind-notify-" + position;
  // Find an element with the id 'wind-notify'
  let toastyContainer = document.getElementById(containerId);
  if (!toastyContainer) {
    // Create the toastyContainer element after the body
    toastyContainer = document.createElement("div");
    // Add the div id to the toastyContainer element
    toastyContainer.id = containerId;
    // append the toastyContainer element to the body
    body.appendChild(toastyContainer);
  }
  // Add the style to the main toastyContainer element so we can use it
  toastDefaultStyle(toastyContainer, position, zIndex);

  const toastyMessage = document.createElement("div");
  // Add padding class to the toasty message
  toastyMessage.className =
    "p-3 block transform transition-all duration-150 ease-out scale-0";
  toastyContainer.appendChild(toastyMessage);
  // Start the toasty animation
  toastsAnimation(toastyMessage);

  // Add the html to the toasty element
  switch (alertType) {
    case "info":
      toastyMessage.innerHTML = info(title, message);
      break;
    case "error":
      toastyMessage.innerHTML = error(title, message);
      break;
    case "success":
      toastyMessage.innerHTML = success(title, message);
      break;
    default:
      toastyMessage.innerHTML = warning(title, message);
      break;
  }
  // Move the progress bar once reached the end of the toasty, remove the toasty
  moveProgressBar(toastyMessage, duration);
};

/**
 * Add the default style to the main toasty element
 *
 * @param mixed element
 *
 * @return [type]
 */
function toastDefaultStyle(
  toastyContainer: HTMLElement,
  position: Position,
  zIndex = 10000,
) {
  // Set the fixed positioning and other styles
  toastyContainer.style.position = "fixed";
  toastyContainer.style.zIndex = zIndex.toString();
  toastyContainer.style.width = "300px"; // Set a default width

  switch (position) {
    case "left":
      toastyContainer.style.top = "50%";
      toastyContainer.style.transform = "translateY(-50%)";
      toastyContainer.style.left = "1rem";
      break;
    case "right":
      toastyContainer.style.top = "50%";
      toastyContainer.style.transform = "translateY(-50%)";
      toastyContainer.style.right = "1rem";
      break;
    case "top":
      toastyContainer.style.top = "1rem";
      toastyContainer.style.left = "50%";
      toastyContainer.style.transform = "translateX(-50%)";
      break;
    case "bottom":
      toastyContainer.style.bottom = "1rem";
      toastyContainer.style.left = "50%";
      toastyContainer.style.transform = "translateX(-50%)";
      break;
    case "middle":
      toastyContainer.style.top = "50%";
      toastyContainer.style.left = "50%";
      toastyContainer.style.transform = "translate(-50%, -50%)";
      break;
    case "top-right":
      toastyContainer.style.top = "1rem";
      toastyContainer.style.right = "1rem";
      break;
    case "top-left":
      toastyContainer.style.top = "1rem";
      toastyContainer.style.left = "1rem";
      break;
    case "bottom-right":
      toastyContainer.style.bottom = "1rem";
      toastyContainer.style.right = "1rem";
      break;
    case "bottom-left":
      toastyContainer.style.bottom = "1rem";
      toastyContainer.style.left = "1rem";
      break;
    default:
      toastyContainer.style.bottom = "1rem";
      toastyContainer.style.right = "1rem";
      break;
  }

  toastyContainer.style.maxHeight = "calc(100vh - 2rem)";
  toastyContainer.style.overflowY = "auto"; // Allow scrolling if there are too many toasts
}

/**
 * Animate the toasty message using tailwindcss animation classes
 *
 * @param mixed element
 *
 * @return [type]
 */
function toastsAnimation(element: HTMLElement) {
  setTimeout(() => {
    // Remove class 'hidden' from the toasty element
    element.classList.remove("scale-0");
    // Add class 'animate' to the toasty element
    element.classList.add("scale-100");
  }, 200);
}

/**
 * Move the progress bar with a smoother ease-out progression.
 * Once the progress bar reaches the end, remove the toast notification.
 *
 * @param {HTMLElement} element - The toast container element.
 * @param {number} duration - Duration in seconds for the toast to last.
 */
function moveProgressBar(element: HTMLElement, duration: number) {
  const progressBar = element.querySelector(".progress") as HTMLProgressElement;
  if (!progressBar) return;

  const totalFrames = duration * 60; // Assuming 60 frames per second
  let frameCount = 0;

  const increment = () => {
    // Use ease-out progression
    const progress = Math.min((frameCount / totalFrames) ** 0.5 * 100, 100);

    progressBar.value = progress;

    if (frameCount >= totalFrames) {
      element.classList.add("scale-0");
      setTimeout(() => {
        element.remove();
      }, 200);
    } else {
      frameCount++;
      requestAnimationFrame(increment);
    }
  };

  increment();
}

/**
 * Used in the button when the user clicks the button to remove the toasty
 *
 * @param mixed element
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeWindToast(element: any) {
  const target = element.target;
  // Get target parent element
  const parent =
    target.parentElement.parentElement.parentElement.parentElement
      .parentElement;
  parent.remove();
}

// Only add to window if we're in a browser environment
declare global {
  interface Window {
    removeWindToast: typeof removeWindToast;
  }
}

if (typeof window !== "undefined") {
  window.removeWindToast = removeWindToast;
}
