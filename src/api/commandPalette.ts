import type { DialogInstance } from '../types';
import { open } from './open';

export interface Command {
  id: string;
  label: string;
  keywords?: string[];
  shortcut?: string;
  run: () => void | Promise<void>;
}

export function commandPalette(commands: Command[]): DialogInstance<string> {
  const instance: DialogInstance<string> = open<string>({
    title: 'Command palette',
    className: 'fd-command-palette',
    content: (container) => {
      const input = document.createElement('input');
      input.className = 'fd-input';
      input.placeholder = 'Type a command…';
      input.setAttribute('aria-label', 'Search commands');
      input.setAttribute('data-fd-autofocus', '');
      const list = document.createElement('div');
      list.className = 'fd-command-list';
      const render = () => {
        const query = input.value.trim().toLowerCase();
        list.replaceChildren();
        commands
          .filter((command) =>
            [command.label, ...(command.keywords ?? [])].join(' ').toLowerCase().includes(query),
          )
          .forEach((command) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'fd-command';
            button.textContent = command.shortcut
              ? `${command.label}  ${command.shortcut}`
              : command.label;
            button.addEventListener('click', async () => {
              await command.run();
              await instance.close(command.id, 'button');
            });
            list.appendChild(button);
          });
      };
      input.addEventListener('input', render);
      container.append(input, list);
      render();
    },
  });
  return instance;
}
