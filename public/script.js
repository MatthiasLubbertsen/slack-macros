// copilot: fetch api/commands and show in .commands
document.addEventListener('DOMContentLoaded', async () => {
    const commandsDiv = document.querySelector('.commands');

    try {
        const response = await fetch('/api/json/commands');
        const data = await response.json();

        if (data.commands) {
            const ul = document.createElement('ul');
            ul.className = 'space-y-1'; // Reduced space-y because individual items now have padding
            
            data.commands.forEach(command => {
                const li = document.createElement('li');
                li.className = 'flex items-baseline group p-2 -mx-2 rounded-lg transition-all duration-200 cursor-default';
                li.innerHTML = `<code class="flex-none text-yellow-300 bg-yellow-400/10 px-2 py-0.5 rounded text-sm font-mono mr-3 border border-yellow-400/20 group-hover:border-yellow-400/40 group-hover:bg-yellow-400/15 transition-colors duration-200">/slam ${command.abbreviation}</code> <span class="text-orange-100/75 text-sm md:text-base group-hover:text-orange-100/90 transition-colors">${command.description}</span>`;
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
