const updateName = async (firstName, lastName) => {
  const response = await fetch('/api/users/update-name', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ firstName, lastName }),
  });

  if (!response.ok) {
    throw new Error('Failed to update name');
  }

  return response;
};

export const userService = {
  updateName,
};
