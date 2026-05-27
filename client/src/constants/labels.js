// Predefined label options and their fixed color styles.
// Used by AddCardForm (chip picker), Card (display + edit), and Dashboard (filter).

export const ALL_LABELS = ['Bug', 'Feature', 'Design', 'Research', 'Urgent', 'Review'];

// Tailwind classes for each label.
// "chip"    = selected state (solid background)
// "outline" = unselected state (border only)
export const LABEL_STYLES = {
  Bug:      { chip: 'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',    outline: 'border-red-300    text-red-500    dark:border-red-700    dark:text-red-400'    },
  Feature:  { chip: 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',   outline: 'border-blue-300   text-blue-500   dark:border-blue-700   dark:text-blue-400'   },
  Design:   { chip: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', outline: 'border-purple-300 text-purple-500 dark:border-purple-700 dark:text-purple-400' },
  Research: { chip: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', outline: 'border-yellow-300 text-yellow-600 dark:border-yellow-700 dark:text-yellow-400' },
  Urgent:   { chip: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', outline: 'border-orange-300 text-orange-500 dark:border-orange-700 dark:text-orange-400' },
  Review:   { chip: 'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-300',  outline: 'border-green-300  text-green-600  dark:border-green-700  dark:text-green-400'  },
};
