import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { ModalHeader, ModalInput, ModalFooter } from './ModalComponents';

interface NewCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (categoryName: string) => void;
  initialValue?: string;
}

export default function NewCategoryModal({
  visible,
  onClose,
  onSave,
  initialValue = '',
}: NewCategoryModalProps): React.ReactElement {
  const [categoryName, setCategoryName] = useState(initialValue);

  const handleSave = (): void => {
    if (categoryName.trim()) {
      onSave(categoryName.trim());
      setCategoryName('');
      onClose();
    }
  };

  const handleCancel = (): void => {
    setCategoryName(initialValue);
    onClose();
  };

  const handleClose = (): void => {
    setCategoryName(initialValue);
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      closeOnBackdropPress={true}
      closeOnBackButton={true}
    >
      <ModalHeader title="New Category" />
      
      <ModalInput
        placeholder="Write..."
        value={categoryName}
        onChangeText={setCategoryName}
        autoFocus={visible}
        maxLength={50}
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      <ModalFooter
        primaryButton={{
          title: 'Save',
          onPress: handleSave,
          disabled: !categoryName.trim(),
        }}
        secondaryButton={{
          title: 'cancel',
          onPress: handleCancel,
        }}
      />
    </BaseModal>
  );
}