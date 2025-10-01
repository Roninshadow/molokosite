import Swiper from 'swiper/bundle'

const popUpForm = document.querySelector('.form__popUp')
const popUpProjects = document.querySelector('.projects__popUp')
const popUpReview = document.querySelector('.review__popUp')
const popUpEnd = document.querySelectorAll('.end__popUp')
const cross = document.querySelectorAll('.cross')
const formOpen = document.querySelectorAll('.form')
const projectsOpen = document.querySelectorAll('.works__item')
const tabs = document.querySelectorAll('.steps__tab')
const lists = document.querySelectorAll('.steps__list')
const worksBtn = document.querySelector('.works__btn')
const worksList = document.querySelector('.works__list')
const rateTabs = document.querySelectorAll('.rate__tab')
const rateLists = document.querySelectorAll('.rate__list')
const reviewBtn = document.querySelectorAll('.review-btn')
const burger = document.querySelector('.burger')
const burgerBtn = document.querySelector('.header-burger-btn')


burgerBtn.addEventListener('click', () => {
	burger.showModal()
	document.body.classList.add('scroll-block')
})
// Закрытие всех попапов
cross.forEach(i => {
	i.addEventListener('click', () => {
		if (popUpForm.open) popUpForm.close()
		if (popUpProjects.open) popUpProjects.close()
		if (popUpReview.open) popUpReview.close()
		if (burger.open) burger.close()
		popUpEnd.forEach(popup => {
			if (popup.open) popup.close()
		})
		document.body.classList.remove('scroll-block')
	})
})

// Открытие попапов
formOpen.forEach(i => {
	i.addEventListener('click', () => {
		popUpForm.showModal()
		document.body.classList.add('scroll-block')
	})
})

projectsOpen.forEach(i => {
	i.addEventListener('click', () => {
		popUpProjects.showModal()
		document.body.classList.add('scroll-block')
	})
})

reviewBtn.forEach(i => {
	i.addEventListener('click', () => {
		popUpReview.showModal()
		document.body.classList.add('scroll-block')
	})
})

// Табы секции "Этапы работ"
tabs.forEach(tab => {
	tab.addEventListener('click', () => {
		const tabIndex = tab.dataset.tab

		// Убираем активные классы
		tabs.forEach(t => t.classList.remove('active'))
		lists.forEach(l => l.classList.remove('active'))

		// Делаем активным текущую вкладку и список
		tab.classList.add('active')
		document.querySelector(`.steps__list[data-tab="${tabIndex}"]`).classList.add('active')
	})
})

// Кнопка "Показать больше" для worksList
worksBtn.addEventListener('click', () => {
	worksList.classList.toggle('active')
	if (worksList.classList.contains('active')) {
		worksBtn.textContent = 'Скрыть'
	} else {
		worksBtn.textContent = 'Показать больше'
	}
})

// Табы секции "Тарифы/Продукты"
rateTabs.forEach((tab, index) => {
	tab.addEventListener('click', () => {
		// Убираем активные классы со всех вкладок и списков
		rateTabs.forEach(t => t.classList.remove('active'))
		rateLists.forEach(l => l.classList.remove('active'))

		// Добавляем активный класс выбранной вкладке и соответствующему списку
		tab.classList.add('active')
		rateLists[index].classList.add('active')
	})
})

if (window.innerWidth > 480 && !swiper) {
	swiper = new Swiper('.articles-swiper', {
		slidesPerView: 'auto',
		spaceBetween: 20,
		autoplay: {
			delay: 5000,
			disableOnInteraction: false,
		},
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		},
	})
} else if (window.innerWidth <= 480 && swiper) {
	// уничтожаем слайдер на малых экранах
	swiper.destroy(true, true)
	swiper = undefined
}
if (window.innerWidth > 480 && !swiper1) {
	swiper1 = new Swiper('.review-swiper', {
		slidesPerView: 'auto',
		spaceBetween: 20,
		autoplay: {
			delay: 5000,
			disableOnInteraction: false,
		},
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		},
	})
} else if (window.innerWidth <= 480 && swiper1) {
	// уничтожаем слайдер на малых экранах
	swiper1.destroy(true, true)
	swiper1 = undefined
}