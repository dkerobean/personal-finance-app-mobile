// Base Modal Component
export { default as BaseModal } from './BaseModal';

// Modal UI Components
export {
  ModalHeader,
  ModalInput,
  ModalButton,
  ModalFooter,
} from './ModalComponents';

// Pre-built Modal Implementations
export { default as NewCategoryModal } from './NewCategoryModal';

// Types
export interface ModalButtonConfig {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
}