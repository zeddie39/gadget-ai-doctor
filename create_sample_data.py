import numpy as np

# Create sample data for binary classification
np.random.seed(42)
x_train = np.random.randn(100, 10)
y_train = np.random.randint(0, 2, 100)

# Save as .npz
np.savez('sample_data.npz', x=x_train, y=y_train)
print("Sample data created: sample_data.npz")
