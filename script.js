document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('start');
    const timeDisplay = document.getElementById('time');
    const taskList = document.getElementById('task-list');
    const newTaskInput = document.getElementById('new-task-input');
    const headerTitle = document.querySelector('header h1');
    const navPomodoro = document.getElementById('nav-pomodoro');
    const navBreak = document.getElementById('nav-break');
    const pomodoroContent = document.getElementById('pomodoro-content');
    const breakContent = document.getElementById('break-content');
    const breakList = document.getElementById('break-list');
    const breakInput = document.getElementById('break-input');
    const videoDisplay = document.getElementById('video-display');
    let timer;
    let activeTask = null;

    navPomodoro.addEventListener('click', function () {
        navPomodoro.classList.add('active');
        navBreak.classList.remove('active');
        pomodoroContent.style.display = 'block';
        breakContent.style.display = 'none';
    });

    navBreak.addEventListener('click', function () {
        navBreak.classList.add('active');
        navPomodoro.classList.remove('active');
        pomodoroContent.style.display = 'none';
        breakContent.style.display = 'block';
    });

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => addTask(task, false));
        const breaks = JSON.parse(localStorage.getItem('breaks')) || [];
        breaks.forEach(link => addBreak(link, false));
        if (breaks.length > 0) {
            displayVideo(breaks[0]);
        }
    }

    function saveTasks() {
        const tasks = Array.from(document.querySelectorAll('.task')).map(taskItem => {
            const taskName = taskItem.querySelector('.task-name').textContent;
            const status = taskItem.classList.contains('completed') ? 'completed' : 'in_progress';
            const time = taskItem.getAttribute('data-time') || '25:00';
            const note = taskItem.querySelector('.note-input').value;
            return { name: taskName, status, time, note };
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        const breaks = Array.from(document.querySelectorAll('.break-item')).map(breakItem => {
            return breakItem.querySelector('span').textContent;
        });
        localStorage.setItem('breaks', JSON.stringify(breaks));
    }

    function startTimer() {
        const timeArray = timeDisplay.textContent.split(':');
        let minutes = parseInt(timeArray[0]);
        let seconds = parseInt(timeArray[1]);

        if (startButton.textContent === 'START') {
            startButton.textContent = 'STOP';
            timer = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        clearInterval(timer);
                        startButton.textContent = 'START';
                        // alert('Time is up!');
                    } else {
                        minutes--;
                        seconds = 59;
                    }
                } else {
                    seconds--;
                }
                timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                if (activeTask) {
                    activeTask.setAttribute('data-time', timeDisplay.textContent);
                    saveTasks();
                }
            }, 1000);
        } else {
            clearInterval(timer);
            startButton.textContent = 'START';
        }
    }

    function addTask(task, save = true) {
        const taskItem = document.createElement('li');
        taskItem.className = 'task';
        taskItem.setAttribute('data-time', task.time || '25:00');
        if (task.status === 'completed') {
            taskItem.classList.add('completed');
        }
        taskItem.innerHTML = `
            <div class="task-item">
                <span class="task-name">${task.name}</span>
                <div class="actions">
                    <button class="complete-task">
                        <span class="material-symbols-outlined">
                            task_alt
                        </span>
                    </button>
                    <button class="delete-task">
                        <span class="material-symbols-outlined">
                            delete_sweep
                        </span>
                    </button>
                </div>
            </div>
            <textarea class="note-input" data-provide="markdown" placeholder="Write your notes here...">${task.note || ''}</textarea>
        `;
        taskList.appendChild(taskItem);

        taskItem.querySelector('.note-input').addEventListener('input', saveTasks);
        taskItem.querySelector('.note-input').addEventListener('click', function (e) {
            e.stopPropagation();
        });

        taskItem.addEventListener('click', function () {
            document.querySelectorAll('.task').forEach(task => task.classList.remove('active'));
            taskItem.classList.add('active');
            timeDisplay.textContent = taskItem.getAttribute('data-time');
            headerTitle.textContent = `Focus on ${task.name}`;
            if (taskItem.classList.contains('completed')) {
                taskItem.classList.remove('completed');
                taskItem.classList.add('in_progress');
            }
            activeTask = taskItem;
            startTimer();
        });

        taskItem.querySelector('.complete-task').addEventListener('click', function (e) {
            e.stopPropagation();
            taskItem.classList.toggle('completed');
            saveTasks();
        });

        taskItem.querySelector('.delete-task').addEventListener('click', function (e) {
            e.stopPropagation();
            taskList.removeChild(taskItem);
            saveTasks();
        });

        if (save) saveTasks();
    }

    async function addBreak(link, save = true) {
        const videoId = link.split('v=')[1] || link.split('/').pop();
        const apiUrl = `/.netlify/functions/youtube?videoId=${videoId}`;
        let videoTitle = link;
    
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.items.length > 0) {
                videoTitle = data.items[0].snippet.title;
                if (videoTitle.length > 50) {
                    videoTitle = videoTitle.substring(0, 47) + '...';
                }
            }
        } catch (error) {
            console.error('Error fetching video title:', error);
        }
    
        const breakItem = document.createElement('li');
        breakItem.className = 'break-item';
        breakItem.innerHTML = `
            <span>${videoTitle}</span>
            <div class="actions">
                <button class="delete-break">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        breakList.appendChild(breakItem);
    
        breakItem.addEventListener('click', function () {
            document.querySelectorAll('.break-item').forEach(item => item.classList.remove('active'));
            breakItem.classList.add('active');
            displayVideo(link);
        });
    
        breakItem.querySelector('.delete-break').addEventListener('click', function (e) {
            e.stopPropagation();
            breakList.removeChild(breakItem);
            saveTasks();
        });
    
        if (save) saveTasks();
    }

    function displayVideo(link) {
        const videoId = link.split('v=')[1] || link.split('/').pop();
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        videoDisplay.innerHTML = `<iframe width="100%" height="315" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }

    newTaskInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const taskText = newTaskInput.value.trim();
            if (taskText !== '') {
                addTask({ name: taskText, status: 'in_progress', time: '25:00' });
                newTaskInput.value = '';
            }
        }
    });

    breakInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const link = breakInput.value.trim();
            if (link !== '') {
                addBreak(link);
                breakInput.value = '';
            }
        }
    });

    startButton.addEventListener('click', function () {
        startTimer();
    });

    loadTasks();
});
