// Example controller for GoA services
// This would typically interact with a database

const mockServices = [
  {
    id: '1',
    name: 'Parks Alberta',
    description: 'Explore and book Alberta\'s provincial parks',
    url: '/parks',
    icon: 'tree'
  },
  {
    id: '2',
    name: 'Healthcare Services',
    description: 'Access healthcare information and services',
    url: '/healthcare',
    icon: 'heart'
  },
  {
    id: '3',
    name: 'Education Portal',
    description: 'Education resources and information',
    url: '/education',
    icon: 'school'
  },
  {
    id: '4',
    name: 'Business Services',
    description: 'Start and manage your business in Alberta',
    url: '/business',
    icon: 'briefcase'
  }
];

export const getServices = async (req, res, next) => {
  try {
    // In a real application, this would query a database
    res.json({
      success: true,
      data: mockServices,
      count: mockServices.length
    });
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = mockServices.find(s => s.id === id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
};
