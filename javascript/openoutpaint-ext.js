// Txt2Img Send to Resource
const openoutpaint = {
	frame: null,
	key: null,
};

async function openoutpaint_get_image_from_gallery() {
	return new Promise(function (resolve, reject) {
		var buttons = gradioApp().querySelectorAll(
			'[style="display: block;"].tabitem div[id$=_gallery] .gallery-item'
		);
		var button = gradioApp().querySelector(
			'[style="display: block;"].tabitem div[id$=_gallery] .gallery-item.\\!ring-2'
		);

		if (!button) button = buttons[0];

		if (!button)
			reject(new Error("[openoutpaint] No image available in the gallery"));

		const canvas = document.createElement("canvas");
		const image = document.createElement("img");
		image.onload = () => {
			canvas.width = image.width;
			canvas.height = image.height;

			canvas.getContext("2d").drawImage(image, 0, 0);

			resolve(canvas.toDataURL());
		};
		image.src = button.querySelector("img").src;
	});
}

function openoutpaint_send_gallery(name = "Embed Resource") {
	openoutpaint_get_image_from_gallery()
		.then((dataURL) => {
			// Send to openOutpaint
			openoutpaint.frame.contentWindow.postMessage({
				key: openoutpaint.key,
				type: "openoutpaint/add-resource",
				image: {
					dataURL,
					resourceName: name,
				},
			});

			// Send prompt to openOutpaint
			const tab = get_uiCurrentTabContent().id;
			const prompt =
				tab === "tab_txt2img" ? txt2img_textarea.value : img2img_textarea.value;
			const negPrompt =
				tab === "tab_txt2img"
					? gradioApp().querySelector("#txt2img_neg_prompt textarea").value
					: gradioApp().querySelector("#img2img_neg_prompt textarea").value;
			openoutpaint.frame.contentWindow.postMessage({
				key: openoutpaint.key,
				type: "openoutpaint/set-prompt",
				prompt,
				negPrompt,
			});

			// Change Tab
			Array.from(
				gradioApp().querySelectorAll("#tabs > div:first-child button")
			).forEach((button) => {
				if (button.textContent.trim() === "openOutpaint") {
					button.click();
				}
			});
		})
		.catch((error) => {
			console.warn("[openoutpaint] No image selected to send to openOutpaint");
		});
}

const openoutpaintjs = async () => {
	const frame = gradioApp().getElementById("openoutpaint-iframe");
	const key = gradioApp().getElementById("openoutpaint-key").value;

	openoutpaint.frame = frame;
	openoutpaint.key = key;

	// Listens for messages from the frame
	console.info("[embed] Add message listener");
	window.addEventListener("message", ({data, origin, source}) => {
		if (source === frame.contentWindow) {
			switch (data.type) {
				case "openoutpaint/ack":
					if (data.message.type === "openoutpaint/init") {
						console.info("[embed] Received init ack");
						clearTimeout(initLoop);
						initLoop = null;
					}
					break;
			}
		}
	});

	// Initializes communication channel
	let initLoop = null;
	const sendInit = () => {
		console.info("[embed] Sending init message");
		frame.contentWindow.postMessage({
			type: "openoutpaint/init",
			key,
			host: window.location.origin,
		});
		initLoop = setTimeout(sendInit, 1000);
	};

	frame.addEventListener("load", () => {
		sendInit();
	});

	// Setup openOutpaint tab scaling
	const tabEl = gradioApp().getElementById("tab_openOutpaint");
	frame.style.left = "0px";

	const refreshBtn = document.createElement("button");
	refreshBtn.id = "openoutpaint-refresh";
	refreshBtn.textContent = "🔄";
	refreshBtn.title = "Refresh openOutpaint";
	refreshBtn.style.width = "fit-content";
	refreshBtn.classList.add("gr-button", "gr-button-lg", "gr-button-secondary");
	refreshBtn.style.cssText = "max-width: 50px;";
	refreshBtn.addEventListener("click", () => {
		frame.contentWindow.location.reload();
	});
	tabEl.appendChild(refreshBtn);

	const recalculate = () => {
		// If we are on the openoutpaint tab, recalculate
		if (tabEl.style.display !== "none") {
			frame.style.height = window.innerHeight + "px";
			const current = document.body.scrollHeight;
			const bb = frame.getBoundingClientRect();
			const iframeh = bb.height;
			const innerh = window.innerHeight;
			frame.style.height = `${iframeh + (innerh - current)}px`;
			frame.style.width = `${window.innerWidth}px`;
			frame.style.left = `${parseInt(frame.style.left, 10) - bb.x}px`;
		}
	};

	window.addEventListener("resize", () => {
		recalculate();
	});

	new MutationObserver((e) => {
		recalculate();
	}).observe(tabEl, {
		attributes: true,
	});
};
document.addEventListener("DOMContentLoaded", () => {
	const onload = () => {
		if (gradioApp().getElementById("openoutpaint-iframe")) {
			openoutpaintjs();
		} else {
			setTimeout(onload, 10);
		}
	};
	onload();
});
