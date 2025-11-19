export function jsHeader(globalNav) {
	const globalnavLinks = globalNav.querySelectorAll('.sb-appshell-v1-header-nav_globalnav-link');
	const hSearch = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-search');
	const megadropdown = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown');
	const megadropdownContent = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-contents');

	// status variable
	let isDropDownMenuOpen = false;
	let isNavigatorHover = false;
	let isDropDownMenuHover = false;

	globalnavLinks.forEach(globalnavLink => {
		globalnavLink.addEventListener('mouseenter', e => {
			isNavigatorHover = true;
			const _this = e.target;
			const menuHref = _this.getAttribute('data-href');
			if (menuHref) {
				const categoryTarget = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-category-item[data-sb-megadropdown-category="' + menuHref + '"]');
				if (categoryTarget) {
					if (isDropDownMenuOpen && !categoryTarget.classList.contains('sb-appshell-v1-header-nav_megadropdown-category-item--current')) {
						// remove statement of link
						globalnavLinks.forEach(globalnavLink => globalnavLink.classList.remove('sb-appshell-v1-header-nav_globalnav-link--open'));
						_this.classList.add("sb-appshell-v1-header-nav_globalnav-link--open");

						//excute previous item
						const prevTarget = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-category-item.sb-appshell-v1-header-nav_megadropdown-category-item--current');
						prevTarget.classList.add('sb-appshell-v1-header-nav_megadropdown-category-item--preview');
						prevTarget.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--current');
						setTimeout(function () {
							prevTarget.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--preview');
						}, 700);

						//excute curent item
						categoryTarget.classList.add("sb-appshell-v1-header-nav_megadropdown-category-item--current");

						// animate height dropdown content
						megadropdownContent.style.height = prevTarget.offsetHeight + 'px';

						megadropdownContent.style.transition = "height 0.4s";
						megadropdownContent.style.height = categoryTarget.offsetHeight + "px";
						setTimeout(function () {
							megadropdownContent.style.height = "auto";
						}, 400);
					} else {
						megadropdown.classList.add('sb-appshell-v1-header-nav_megadropdown--show');
						Object.assign(megadropdown.style, {
							display: "block",
							opacity: "1",
							height: "auto",
							top: "28px"
						});
						hSearch.classList.add("sb-appshell-v1-header-nav_megadropdown-header-search--open");
						_this.classList.add("sb-appshell-v1-header-nav_globalnav-link--open");
						categoryTarget.classList.add("sb-appshell-v1-header-nav_megadropdown-category-item--current");
						megadropdownContent.style.height = "auto";
					}
					isDropDownMenuOpen = true;
				};
			} else {
				if (isDropDownMenuOpen) {
					closeMenuDropDown();
				};
			};
		});

		globalnavLink.addEventListener('mouseleave', (e) => {
			isNavigatorHover = false;
			const _this = e.target;
			_this.classList.remove("sb-appshell-v1-header-nav_globalnav-link--open");
			setTimeout(function () {
				if (!isDropDownMenuHover && !isNavigatorHover) {
					closeMenuDropDown();
				}
			}, 100);
		});
	});

	megadropdown?.addEventListener('mouseenter', () => {
		isDropDownMenuHover = true;
	});

	megadropdown?.addEventListener('mouseleave', () => {
		isDropDownMenuHover = true;

		setTimeout(() => { isDropDownMenuHover = false; }, 50);
		setTimeout(() => {
			if (!isDropDownMenuHover && !isNavigatorHover) {
				closeMenuDropDown();
			}
		}, 100);
	});

	function closeMenuDropDown() {
		megadropdown.classList.remove('sb-appshell-v1-header-nav_megadropdown--show');
		Object.assign(megadropdown.style, {
			display: "none",
			opacity: "0",
			height: "auto",
			top: "28px"
		});
		megadropdownContent.style = "";
		globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-category-item').forEach(item => item.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--current'));
		hSearch.classList.remove("sb-appshell-v1-header-nav_megadropdown-header-search--open");
		isDropDownMenuOpen = false;
	};

	if (globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-close-button')) {
		globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-close-button').addEventListener('click', () => {
			closeMenuDropDown();
		});
	};

	if (globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5').length) {
		globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5').forEach((el) => {
			el.closest('.sb-appshell-v1-header-nav_megadropdown-lv4-item').querySelector('.sb-appshell-v1-header-nav_megadropdown-lv4-link').classList.add('sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion');
			el.classList.add('disp-none');
			el.style.height = 'auto';
		});

		globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion').forEach(accordion => {
			accordion.addEventListener('click', (e) => {
				const el = e.target;
				const elParent = el.closest('.sb-appshell-v1-header-nav_megadropdown-lv4-item');
				const targetItem = elParent.querySelector('.sb-appshell-v1-header-nav_megadropdown-lv5');
				const megadropdownWidth = megadropdown.clientWidth;
				const targetItemPosition = (el.getBoundingClientRect().left + window.scrollX) - (megadropdown.getBoundingClientRect().left + window.scrollX);

				if (elParent.classList.contains('sb-appshell-v1-header-nav_megadropdown-lv4--open')) {
					elParent.classList.remove('sb-appshell-v1-header-nav_megadropdown-lv4--open');
				} else {
					globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv4-item').forEach(item => item.classList.remove('sb-appshell-v1-header-nav_megadropdown-lv4--open'));
					globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5').forEach(item => {
						item.classList.add('disp-none');
						item.style.setProperty('height', 'auto', 'important');
					});
					elParent.classList.add('sb-appshell-v1-header-nav_megadropdown-lv4--open');
				}

				Object.assign(targetItem.style, {
					width: `${megadropdownWidth}px`,
					transform: `translateX(-${targetItemPosition}px)`
				});
				let initialHeight = targetItem.offsetHeight;
				if (targetItem.classList.contains('disp-none')) {
					targetItem.classList.remove('disp-none');
					initialHeight = targetItem.offsetHeight;
					targetItem.style.height = "0px";
					targetItem.animate([
						{ height: "0px" },
						{ height: initialHeight + "px" }
					], { duration: 250, fill: "forwards" });
				} else {
					targetItem.animate([
						{ height: initialHeight + "px" },
						{ height: "0px" }
					], { duration: 250, fill: "forwards" });
				};
				e.stopImmediatePropagation();
			});
		});
	};
};

export function jsHeaderSp(globalNav) {
	const headerSpBtnOpen = globalNav.querySelector('.sb-appshell-v1-header_menu-button');
	const headerSpBtnClose = globalNav.querySelector('.sb-appshell-v1-menu_button-close');
	const headerSpMenu = globalNav.querySelector('#sb-appshell-v1-menu');
	headerSpBtnOpen?.addEventListener('click', () => {
		if (headerSpMenu.classList.contains('sb-appshell-v1-menu--hide')) {
			headerSpMenu.classList.remove('sb-appshell-v1-menu--hide');
			headerSpMenu.classList.add('sb-appshell-v1-menu--show');
			Object.assign(headerSpMenu.style, {
				opacity: "0",
				display: "block",
				top: "0",
				height: "100vh",
				"overflow-y": "scroll"
			});

			headerSpMenu.animate([
				{ opacity: 0 },
				{ opacity: 1 }
			], { duration: 400, fill: "forwards" });
		} else {
			headerSpMenu.classList.remove('sb-appshell-v1-menu--show');
			headerSpMenu.classList.add('sb-appshell-v1-menu--hide');
			headerSpMenu.animate([
				{ opacity: 1 },
				{ opacity: 0 }
			], { duration: 400, fill: "forwards" }).onfinish = () => {
				headerSpMenu.style = "";
			};
		};
	});

	headerSpBtnClose?.addEventListener('click', () => {
		headerSpMenu.classList.remove('sb-appshell-v1-menu--show');
		headerSpMenu.classList.add('sb-appshell-v1-menu--hide');
		headerSpMenu.animate([
			{ opacity: 1 },
			{ opacity: 0 }
		], { duration: 400, fill: "forwards" }).onfinish = () => {
			headerSpMenu.style = "";
		};
	});

	const initHeaderSP = () => {
		if (document.documentElement.clientWidth >= 769 && headerSpMenu) {
			// menu sp
			headerSpMenu.classList.remove('sb-appshell-v1-menu--show');
			headerSpMenu.classList.add('sb-appshell-v1-menu--hide');
			headerSpMenu.style = "";
		};
	};
	initHeaderSP();
	window.addEventListener('resize', () => {
		initHeaderSP();
	});

	// accordion level 3
	if (globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4').length) {
		globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4').forEach((el) => {
			el.closest('.sb-appshell-v1-menu_sitemap-lv3-item').querySelector('.sb-appshell-v1-menu_sitemap-lv3-title').classList.add('sb-appshell-v1-menu_sitemap-lv3-title--accordion');
			el.classList.add('disp-none');
			el.style.height = 'auto';
		});
		globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv3-title--accordion').forEach((accordion) => {
			accordion.addEventListener('click', (e) => {
				const el = e.target;
				const elParent = el.closest('.sb-appshell-v1-menu_sitemap-lv3-item');
				const targetItem = elParent.querySelector('.sb-appshell-v1-menu_sitemap-lv4');
				if (elParent.classList.contains('sb-appshell-v1-menu_sitemap-lv4--open')) {
					elParent.classList.remove('sb-appshell-v1-menu_sitemap-lv4--open');
					el.setAttribute('aria-expanded', false);
				} else {
					elParent.classList.add('sb-appshell-v1-menu_sitemap-lv4--open');
					el.setAttribute('aria-expanded', true);
				};
				let initialHeight = targetItem.offsetHeight;
				if (targetItem.classList.contains("disp-none")) {
					targetItem.classList.remove("disp-none");
					initialHeight = targetItem.offsetHeight;
					targetItem.style.height = "0px";
					targetItem.animate([
						{ height: "0px" },
						{ height: initialHeight + "px" }
					], { duration: 250, fill: "forwards" }).onfinish = () => {
						targetItem.style.setProperty('height', 'auto', 'important');
					};
				} else {
					targetItem.style.height = '0px';
					targetItem.animate([
						{ height: initialHeight + "px" },
						{ height: "0px" }
					], { duration: 250, fill: "forwards" }).onfinish = () => {
						targetItem.classList.add('disp-none');
						targetItem.style.setProperty('height', 'auto', 'important');
					};
				};
			});
		});
	};
	// accordion level 4
	if (globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv5').length) {
		globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv5').forEach((el) => {
			el.closest('.sb-appshell-v1-menu_sitemap-lv4-item').querySelector('.sb-appshell-v1-menu_sitemap-lv4-title').classList.add('sb-appshell-v1-menu_sitemap-lv4-title--accordion');
			el.classList.add('disp-none');
			el.style.height = 'auto';
		});
		globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4-title--accordion').forEach((accordion) => {
			accordion.addEventListener('click', (e) => {
				const el = e.target;
				const elParent = el.closest('.sb-appshell-v1-menu_sitemap-lv4-item');
				const targetItem = elParent.querySelector('.sb-appshell-v1-menu_sitemap-lv5');
				if (elParent.classList.contains('sb-appshell-v1-menu_sitemap-lv5--open')) {
					elParent.classList.remove('sb-appshell-v1-menu_sitemap-lv5--open');
					el.setAttribute('aria-expanded', false);
				} else {
					elParent.classList.add('sb-appshell-v1-menu_sitemap-lv5--open');
					el.setAttribute('aria-expanded', true);
				};
				let initialHeight = targetItem.offsetHeight;
				if (targetItem.classList.contains('disp-none')) {
					targetItem.classList.remove('disp-none');
					initialHeight = targetItem.offsetHeight;
					targetItem.style.height = "0px";
					targetItem.animate([
						{ height: "0px" },
						{ height: initialHeight + "px" }
					], { duration: 250, fill: "forwards" }).onfinish = () => {
						targetItem.style.setProperty('height', 'auto', 'important');
					};
				} else {
					targetItem.style.height = '0px';
					targetItem.animate([
						{ height: initialHeight + "px" },
						{ height: "0px" }
					], { duration: 250, fill: "forwards" }).onfinish = () => {
						targetItem.classList.add('disp-none');
						targetItem.style.setProperty('height', 'auto', 'important');
					};
				};
				e.stopImmediatePropagation();
			});
		});
	};
};

// const isDesktop = window.matchMedia('(min-width: 769px)');
// const globalNav = document.querySelector("header .globalnavi");
// isDesktop.matches ? jsHeader(globalNav) : jsHeaderSp(globalNav);

//Yextの設定
// ANSWERS.init({
// 	apiKey: "db70272e9e139383dbd4924eb67e1d8d",
// 	experienceKey: "softbank-biz",
// 	experienceVersion: "PRODUCTION",
// 	locale: "ja",
// 	businessId: "3573698",
// 	templateBundle: TemplateBundle.default,
// 	onReady: function () {
// 		ANSWERS.addComponent("SearchBar", {
// 			container: ".sb-appshell-v1-header-nav_megadropdown-header-search",
// 			name: "search-bar",
// 			redirectUrl: "https://www.softbank.jp/search_result/",
// 			placeholderText: "Search...",
// 		});
// 	},
// });