const React = require('react');

function createIcon(name) {
  return function Icon(props) {
    const { size = 16, className = '', ...rest } = props || {};
    return React.createElement('span', {
      ...rest,
      className,
      style: { display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center' },
      'aria-label': name,
    }, '•');
  };
}

module.exports = {
  Users: createIcon('Users'),
  BarChart2: createIcon('BarChart2'),
  HardHat: createIcon('HardHat'),
  FolderOpen: createIcon('FolderOpen'),
  LogOut: createIcon('LogOut'),
  Home: createIcon('Home'),
  PlusCircle: createIcon('PlusCircle'),
  ArrowLeft: createIcon('ArrowLeft'),
  LayoutDashboard: createIcon('LayoutDashboard'),
  Download: createIcon('Download'),
  User: createIcon('User'),
  Bot: createIcon('Bot'),
  FileText: createIcon('FileText'),
  Eye: createIcon('Eye'),
  Calculator: createIcon('Calculator'),
  ClipboardList: createIcon('ClipboardList'),
  MapPin: createIcon('MapPin'),
  ExternalLink: createIcon('ExternalLink'),
  Archive: createIcon('Archive'),
  UserCircle: createIcon('UserCircle'),
  Plus: createIcon('Plus'),
  LogIn: createIcon('LogIn'),
};
