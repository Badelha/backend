const USER_PUBLIC_SELECT = {
  user_id: true,
  full_name: true,
  phone_number: true,
  address: true,
  email: true,
  account_status: true,
  is_verified: true,
  created_at: true,
  last_login: true,
  total_transactions: true,
  city_id: true,
  city: {
    select: {
      city_id: true,
      city_name: true,
      region: true,
      country: true,
    },
  },
  user_roles: {
    where: { deleted_at: null },
    select: {
      role_id: true,
      user_id: true,
      role: true,
    },
  },
};

function serializeUser(user) {
  if (!user) return user;

  const {
    password_hash,
    refresh_token,
    refresh_token_expires,
    city: cityRecord,
    ...safe
  } = user;

  return {
    ...safe,
    address: user.address ?? null,
    city: cityRecord?.city_name ?? null,
    city_id: user.city_id ?? null,
  };
}

function serializeUsers(users) {
  return (users || []).map(serializeUser);
}

function pickUserProfileInput(body = {}) {
  return {
    fullName: body.fullName,
    phoneNumber: body.phoneNumber,
    address: body.address,
    city: body.city,
    cityId: body.cityId,
    email: body.email,
    password: body.password,
  };
}

module.exports = {
  USER_PUBLIC_SELECT,
  serializeUser,
  serializeUsers,
  pickUserProfileInput,
};
