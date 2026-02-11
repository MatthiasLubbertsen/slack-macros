// copilot: fetch api/commands and show in .commands
document.addEventListener('DOMContentLoaded', async () => {
    const commandsDiv = document.querySelector('.commands');

    try {
        const response = await fetch('/api/commands');
        const data = await response.json();

        if (data.commands) {
            const ul = document.createElement('ul');
            
            data.commands.forEach(command => {
                const li = document.createElement('li');
                li.innerHTML = `<code>/sh ${command.abbreviation}</code> - ${command.description}`;
                ul.appendChild(li);
            });

            commandsDiv.innerHTML = '';
            commandsDiv.appendChild(ul);
        }
    } catch (error) {
        console.error('Error loading commands:', error);
        commandsDiv.innerHTML = '<p>Error loading commands.</p>';
    }
});
